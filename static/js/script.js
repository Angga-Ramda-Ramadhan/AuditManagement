document.getElementById('isoSelect').addEventListener('change', function() {
    const iso = this.value;
    fetch(`/get_data/${iso}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#auditTable tbody');
            tableBody.innerHTML = '';
            data.forEach(item => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.activity}</td>
                        <td>${item.date}</td>
                        <td>${item.description}</td>
                        <td><a href="/static/files/${item.file}" download>Download</a></td>
                        <td>
                            <button onclick="updateActivity(${item.id})">✏️</button>
                            <button onclick="deleteActivity(${item.id})">🗑️</button>
                        </td>
                    </tr>
                `;
            });
        });
});

function updateActivity(id) {
    alert(`Update functionality for ID ${id} is not yet implemented.`);
}

function deleteActivity(id) {
    alert(`Delete functionality for ID ${id} is not yet implemented.`);
}