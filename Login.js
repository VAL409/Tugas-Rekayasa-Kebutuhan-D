(function() {
    if (!window.supabase) {
        console.error('Supabase library tidak ditemukan. Pastikan <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> sudah dimuat.');
        return;
    }

    const supabaseUrl = 'https://dcdxrcqqlliujcniufoh.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZHhyY3FxbGxpdWpjbml1Zm9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODk3OTYsImV4cCI6MjA5MDg2NTc5Nn0.TC4TGI05ab5BR8jIrUTPUZWcUIejwmUVPGoHxi0ss4A';

    window.supabaseClient = window.supabaseClient || window.supabase.createClient(supabaseUrl, supabaseKey);
    const supabase = window.supabaseClient;
    console.log('Supabase initialized:', supabase);

    window.prosesLogin = async function() {
        console.log('prosesLogin called');
        const email = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        console.log('Email:', email, 'Password:', pass ? '***' : 'empty');

        if (!email || !pass) {
            alert('Silakan masukkan email dan password!');
            return;
        }

        const btn = document.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Memproses...';
        btn.disabled = true;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: pass,
            });

            if (error) {
                console.error('Login error:', error);
                alert('Login gagal: ' + error.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
            } else {
                console.log('Login berhasil:', data);
                window.location.href = 'Dashboard.html';
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            alert('Terjadi kesalahan tak terduga: ' + err.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };

    window.cekSesi = async function() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Session check:', session);
            if (session) {
                window.location.href = 'Dashboard.html';
            }
        } catch (err) {
            console.error('Error cek sesi:', err);
        }
    };

    window.logout = async function() {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Logout error:', err);
        }
        window.location.href = 'index.html';
    };

    // dan tidak langsung melompat ke dashboard jika sesi lama masih aktif.
    // window.cekSesi();
})();