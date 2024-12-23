// Handle the file drop event
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");

// Highlight drop zone when dragging over
dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
});

// Remove highlight when drag leaves
dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
});

// Handle file drop
dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");

    const files = e.dataTransfer.files;
    handleFiles(files);
});

// Handle file input change
fileInput.addEventListener("change", () => {
    const files = fileInput.files;
    handleFiles(files);
});

// Display selected files (Optional, just for user feedback)
function handleFiles(files) {
    for (const file of files) {
        console.log(file.name); // You can display this in the UI if needed
    }
}

// Handle form submission with files
document.getElementById("addSubActivityForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent traditional form submission

    const formData = new FormData(event.target); // Get form data

    // Send data to the server
    try {
        const response = await fetch('/sub_activity/<int:activity_id>', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            Swal.fire({
                title: 'Success!',
                text: result.message,
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.reload(); // Reload page after successful submission
            });
        } else {
            Swal.fire({
                title: 'Error!',
                text: result.message || 'An error occurred while adding the activity.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        Swal.fire({
            title: 'Error!',
            text: 'Something went wrong! Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});
