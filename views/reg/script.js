

document.forms["reg"].addEventListener("submit", e => {
    e.preventDefault();
    const form = document.forms["reg"];
    reg(form);
});

async function reg(form) {
    const login = form.elements.login.value;
    const password = form.elements.password.value;

    const response = await fetch('/reg', {
        method: 'POST',
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
                login: login,
                password: password
            }
        )
    });

    form.reset();

    if (response.status != 403) {
        location.href = '/auth';
    }else
        window.alert("User with this login exists!");
}