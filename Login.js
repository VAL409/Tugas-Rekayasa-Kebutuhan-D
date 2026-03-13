function prosesLogin() {
const user = document.getElementById('username').value;
const pass = document.getElementById('password').value;

const isAdmin = user === 'admin' && pass === 'admin123';
const isGuest = user === 'guest' && pass === 'Guest123';

if (isAdmin || isGuest) {

    window.location.href = 'Dashboard.html';
} else {
    alert('Username atau Password salah! Silakan gunakan kredensial yang telah disediakan.');
}
}

function logout() {
window.location.href = 'index.html';
}

function hapusBarisTabel(id) {
const row = document.getElementById(`row-${id}`);
if (row) {
row.remove();
}
}