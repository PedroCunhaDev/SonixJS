import os
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3
from flask import send_from_directory, request, jsonify, render_template, Flask
import webbrowser
import threading

# Set your SDHC card directory here
mp3_directory = "storage/sdcard1/" # tablet
mp3_directory = "../../msc" # PC
playlist_directory = "playlists"

def get_mp3_files(directory):
    mp3_files = []
    for filename in os.listdir(directory):
        if filename.endswith(".mp3"):
            filepath = os.path.join(directory, filename)
            mp3_files.append(filepath)
    return mp3_files

def extract_metadata(filepath, search):
    try:
        audio = MP3(filepath, ID3=EasyID3)
        metadata = {
            'title': audio.get('title', [os.path.basename(filepath).replace('.mp3', '')])[0],
            'artist': audio.get('artist', ['Unknown Artist'])[0],
            'album': audio.get('album', ['Unknown Album'])[0],
            'duration': audio.info.length,
            'filename': os.path.basename(filepath)
        }
        if search is None:
            return metadata
        print(search)
        print(metadata['title'])
        print(search in metadata['title'])
        if (search in metadata['title'].lower() or
            search in metadata['artist'].lower() or
            search in metadata['album'].lower() or
            search in metadata['filename'].lower()):
            return metadata
        print('É DIFERENTE')
        return None
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return None

def get_all_metadata(directory, search):
    files = get_mp3_files(directory)
    metadata_list = []
    for file in files:
        metadata = extract_metadata(file, search if search is not None else None)
        if metadata is not None:
            metadata_list.append(metadata)
    return metadata_list

def get_playlist_path(name):
    return os.path.join(playlist_directory, f"{name}.txt")

def read_playlist(name):
    path = get_playlist_path(name)
    if os.path.exists(path):
        with open(path, 'r') as f:
            return [line.strip() for line in f.readlines()]
    return []

def write_playlist(name, songs):
    path = get_playlist_path(name)
    with open(path, 'w') as f:
        f.write("\n".join(songs))

def delete_playlist(name):
    path = get_playlist_path(name)
    if os.path.exists(path):
        os.remove(path)

def reorder_song_in_playlist(name, old_index, new_index):
    songs = read_playlist(name)
    if 0 <= old_index < len(songs) and 0 <= new_index < len(songs):
        song = songs.pop(old_index)
        songs.insert(new_index, song)
        write_playlist(name, songs)

def list_playlists():
    return [f.replace(".txt", "") for f in os.listdir(playlist_directory) if f.endswith(".txt")]

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/songs', methods=['GET'])
def search():
    search_query = request.args.get('search', '')
    metadata_list = get_all_metadata(mp3_directory, search_query.lower() if search_query else None)
    return jsonify(metadata_list)


@app.route('/song/<filename>')
def serve_mp3(filename):
    return send_from_directory(mp3_directory, filename)

@app.route('/api/update-metadata', methods=['POST'])
def update_metadata():
    data = request.json
    filename = data.get('filename')
    field = data.get('field')
    value = data.get('value')

    filepath = os.path.join(mp3_directory, filename)
    try:
        audio = MP3(filepath, ID3=EasyID3)

        if field in ['title', 'artist', 'album']:
            audio[field] = value
            audio.save()

            if field == 'title':
                new_filename = f"{value}.mp3"
                new_filepath = os.path.join(mp3_directory, new_filename)
                
                os.rename(filepath, new_filepath)
                return jsonify(success=True, new_filename=new_filename)

            return jsonify(success=True)
        else:
            return jsonify(success=False, error='Unsupported field'), 400

    except Exception as e:
        print(f"Error updating metadata for {filename}: {e}")
        return jsonify(success=False, error=str(e)), 500

@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    return jsonify(list_playlists())

@app.route('/api/playlist/<name>', methods=['GET'])
def get_playlist(name):
    return jsonify(read_playlist(name))

@app.route('/api/playlist', methods=['POST'])
def create_playlist():
    data = request.json
    name = data.get('name')
    songs = data.get('songs', [])
    write_playlist(name, songs)
    return jsonify(success=True)

@app.route('/api/playlist/<name>', methods=['DELETE'])
def remove_playlist(name):
    delete_playlist(name)
    return jsonify(success=True)

@app.route('/api/playlist/<name>/reorder', methods=['POST'])
def reorder_playlist_song(name):
    data = request.json
    old_index = data.get('old_index')
    new_index = data.get('new_index')
    reorder_song_in_playlist(name, old_index, new_index)
    return jsonify(success=True)

@app.route('/api/upload', methods=['POST'])
def upload_mp3():
    if 'file' not in request.files:
        return jsonify(success=False, error="No file part"), 400
    file = request.files['file']

    if file.filename == '':
        return jsonify(success=False, error="No selected file"), 400

    if file and file.filename.endswith('.mp3'):
        filename = file.filename
        filepath = os.path.join(mp3_directory, filename)

        file.save(filepath)

        metadata = extract_metadata(filepath)
        if metadata:
            return jsonify(success=True, metadata=metadata)

        return jsonify(success=True, message="File uploaded successfully.")
    
    return jsonify(success=False, error="Invalid file format. Only MP3 files are allowed."), 400

def run_flask():
	app.run(debug=True, use_reloader=False, host="0.0.0.0", port=5000)

if __name__ == '__main__':
    run_flask()