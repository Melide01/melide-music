var pageNumber = -1;
(async function ()  {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.mjs";
    
    const urlParams = new URLSearchParams(window.location.search);
    const bookName = urlParams.get('name') || 'melide_lamourencore';
    pageNumber = parseInt(urlParams.get('page')) || 1;
    const pdfUrl = `../assets/books/${bookName}.pdf`;

    alert("trying its best to load :", pdfUrl)
    
    let doc;
    // ABOVE WORKS FINE
    try {
        loadPdf = pdfjsLib.getDocument(pdfUrl).promise;
        doc = await Promise.race([
            loadPdf,
            new Promise((_, reject) => setTimeout(() => reject(new Error("PDF Load Timeout")), 5000))
        ]);
        alert("PDF Loaded succesfully")
    } catch (error) {
        console.error("Failed to load the PDF. Check the file path", error);
        // THIS CONSOLE LOG OUT IS ALSO IGNORED
    }

    const canvas = document.getElementById('pdf_viewer');
    const context = canvas.getContext('2d');
    
    await getPage(doc, pageNumber);
    document.getElementById('page_count').textContent = doc.numPages;

    document.getElementById('navBtnLeft').addEventListener("click", async () => {
        let newPage = pageNumber - 1;
        if (newPage >= 1) {
            alert(newPage);
            await changePage(doc, newPage);
        };
    });

    document.getElementById('navBtnRight').addEventListener("click", async () => {
        let newPage = pageNumber + 1;
        if (newPage <= doc.numPages) {
            alert(newPage);
            await changePage(doc, newPage);
        };
    });

    canvas.addEventListener("click", async (event) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const canvasWidth = rect.width;

        if (clickX < canvasWidth / 2) {
            if (pageNumber > 1) {
                await changePage(doc, pageNumber - 1);
            }  
        } else {
            await changePage(doc, pageNumber + 1);
        }
    })

    document.addEventListener("popstate", async (event) => {
        let newPage = parseInt(new URLSearchParams(window.location.search).get("page")) || 1;
        if (newPage !== pageNumber && newPage >= 1 && newPage <= doc.numPages) {
            await getPage(doc, newPage);
            pageNumber = newPage;
        }
    });
})();

let renderTask = null;
async function getPage(doc, pageNumber) {
    if (!doc || pageNumber<1 || pageNumber>doc.numPages) {
        alert("big error im crying");
        return;
    }

    try {
        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.getElementById("pdf_viewer");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (renderTask) {
            await renderTask.cancel();
        };

        // this is where it updates the html span page number
        document.getElementById('page_num').textContent = pageNumber;

        renderTask = page.render({ canvasContext: context, viewport: viewport });
        await renderTask.promise;
        renderTask = null;

    } catch (error) {
        if (error.name === "RenderingCancelledException") {
            console.warn("Previous render task was cancelled.");
        } else {
            console.error("Error rendering page:", error);
        }
    }
}

async function changePage(doc, newPage) {
    if (!doc || newPage < 1 || newPage > doc.numPages) return;

    await getPage(doc, newPage);
    pageNumber = newPage;

    const url = new URL(window.location);
    url.searchParams.set("page", newPage);
    history.pushState({}, "", url);
}