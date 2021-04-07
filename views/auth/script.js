

document.forms["login"].addEventListener("submit", e => {
    e.preventDefault();
    const form = document.forms["login"];
    signIn(form);
});

async function signIn(form) {

    const login = form.elements.login.value;
    const password = form.elements.password.value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
                login: login,
                password: password
            }
        )
    });

    form.reset();

    if (response.ok) {
        location.href = '/';
    }else
        alert("User is not found!")
}