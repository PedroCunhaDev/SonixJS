import os
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3
from flask import send_from_directory, request, jsonify, render_template, Flask
import webbrowser
import threading

# Set your SDHC card directory here
mp3_directory = "storage/sdcard1/" # tablet
mp3_directory = "D:/" # PC

def get_mp3_files(directory):
    mp3_files = []
    print(os.listdir(directory))
    for filename in os.listdir(directory):
        if filename.endswith(".mp3"):
            filepath = os.path.join(directory, filename)
            mp3_files.append(filepath)
    return mp3_files

def extract_metadata(filepath):
    try:
        audio = MP3(filepath, ID3=EasyID3)
        metadata = {
            'title': audio.get('title', [os.path.basename(filepath).replace('.mp3', '')])[0],
            'artist': audio.get('artist', ['Unknown Artist'])[0],
            'album': audio.get('album', ['Unknown Album'])[0],
            'duration': audio.info.length,
            'filename': os.path.basename(filepath)
        }
        return metadata
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return None

def get_all_metadata(directory):
    files = get_mp3_files(directory)
    metadata_list = []
    for file in files:
        metadata = extract_metadata(file)
        if metadata:
            metadata_list.append(metadata)
    return metadata_list

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/songs')
def songs():
    metadata_list = get_all_metadata(mp3_directory)
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