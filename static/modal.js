const stylesModal = document.getElementById('styles-modal');
const optionsModal = document.getElementById('options-modal');
const stylesBtn = document.getElementById('styles-btn');
const optionsBtn = document.getElementById('options-btn');

function toggleModal(modal, btn) {
    if (modal.classList.contains('show')) {
        btn.classList.remove('enabled');
        modal.classList.remove('show');
        return;
    }
    btn.classList.add('enabled');
    modal.classList.add('show');
}