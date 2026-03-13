function prosesLogin() {
const user = document.getElementById('username').value;
const pass = document.getElementById('password').value;

  // Support both admin and guest credentials as shown in the UI.
const isAdmin = user === 'admin' && pass === 'admin123';
const isGuest = user === 'guest' && pass === 'Guest123';

if (isAdmin || isGuest) {
// Dashboard is served from style.html in this workspace.
    window.location.href = 'style.html';
} else {
    alert('Username atau Password salah! Silakan gunakan kredensial yang telah disediakan.');
}
}

function logout() {
window.location.href = 'login.html';
}

function hapusBarisTabel(id) {
const row = document.getElementById(`row-${id}`);
if (row) {
row.remove();
}
}