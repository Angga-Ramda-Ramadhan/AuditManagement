document.addEventListener('DOMContentLoaded', () => {
    const isoSelect = document.getElementById('isoSelect');
    const auditTableBody = document.querySelector('#auditTable tbody');

    // Load ISO options
    fetch('/get_iso')
        .then(response => response.json())
        .then(data => {
            data.forEach(iso => {
                const option = document.createElement('option');
                option.value = iso;
                option.textContent = iso;
                isoSelect.appendChild(option);
            });
        });

    // Load activities based on ISO
    isoSelect.addEventListener('change', () => {
        const selectedISO = isoSelect.value;
        fetch(`/get_data/${selectedISO}`)
            .then(response => response.json())
            .then(data => {
                auditTableBody.innerHTML = '';
                data.forEach(activity => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${activity.id}</td>
                        <td><a href="/sub_activity/${activity.id}">${activity.activity}</a></td>
                        <td>${activity.date}</td>
                        <td>${activity.description}</td>
                        <td>
                            <button class="delete-btn" data-id="${activity.id}">Delete</button>
                            <button class="download-btn" data-id="${activity.id}">Download</button>
                        </td>

                    `;
                    auditTableBody.appendChild(row);
                });
            });
    });
    // Add delete functionality
    auditTableBody.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-btn")) {
            const activityId = event.target.getAttribute("data-id");

            if (confirm("Are you sure you want to delete this activity?")) {
                fetch(`/activity/${activityId}/delete`, {
                    method: "POST",
                })
                    .then((response) => response.json())
                    .then((data) => {
                        alert(data.message);
                        const row = event.target.closest("tr");
                        row.remove(); // Remove the row from the table
                    })
                    .catch((error) => console.error("Error:", error));
            }
        }
    });
    
    auditTableBody.addEventListener("click", function (event) {
        // Event untuk tombol Download
        if (event.target.classList.contains("download-btn")) {
            const activityId = event.target.getAttribute("data-id");
    
            fetch(`/activity/${activityId}/download`, {
                method: "GET",
            })
            .then(response => {
                if (response.ok) {
                    return response.blob(); // Mengubah response menjadi file blob
                } else {
                    throw new Error("Failed to download files.");
                }
            })
            .then(blob => {
                // Membuat link virtual untuk mengunduh file
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `activity_${activityId}_files.zip`; // Nama file ZIP
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url); // Membersihkan URL
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Failed to download files.");
            });
        }
    });


    // Add new ISO
    document.getElementById('addISO').addEventListener('click', () => {
        const newISO = document.getElementById('newISO').value;
        fetch('/add_iso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ iso: newISO })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.iso_list) {
                isoSelect.innerHTML = '';
                data.iso_list.forEach(iso => {
                    const option = document.createElement('option');
                    option.value = iso;
                    option.textContent = iso;
                    isoSelect.appendChild(option);
                });
            }
        });
    });
});


document.querySelector("form").addEventListener("submit", function(e) {
    // Jangan gunakan preventDefault kecuali Anda mengirim data secara manual
});

document.addEventListener("DOMContentLoaded", function () {
    const table = document.getElementById("auditTable");

    table.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-btn")) {
            const activityId = event.target.getAttribute("data-id");

            if (confirm("Are you sure you want to delete this activity?")) {
                fetch(`/activity/${activityId}/delete`, {
                    method: "POST",
                })
                    .then((response) => response.json())
                    .then((data) => {
                        alert(data.message);
                        location.reload(); // Refresh halaman setelah delete
                    })
                    .catch((error) => console.error("Error:", error));
            }
        }
    });
});

