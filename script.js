document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formularioBusqueda');
    const infoHojaDiv = document.getElementById('infoHoja');
    const errorMensajeDiv = document.getElementById('errorMensaje');
    const cargandoMensajeDiv = document.getElementById('cargandoMensaje');

    const SPREADSHEET_ID = '1JiAGHdUCLHW4GCnGJSvV05irhsKYYXUCg5VcYPsAwKU'; // Tu ID de la hoja de cálculo

    if (SPREADSHEET_ID === 'TU_SPREADSHEET_ID_AQUI' || SPREADSHEET_ID === '') {
        errorMensajeDiv.textContent = 'ERROR CRÍTICO: El SPREADSHEET_ID no ha sido configurado en script.js. Por favor, edita el archivo.';
        errorMensajeDiv.style.display = 'block';
        return; // Detener la ejecución si el ID no está configurado
    }

    formulario.addEventListener('submit', function(event) {
        event.preventDefault();
        const nombreHojaBuscada = document.getElementById('nombreHoja').value.trim();

        if (!nombreHojaBuscada) {
            errorMensajeDiv.textContent = 'Por favor, ingrese un nombre o número de hoja.';
            errorMensajeDiv.style.display = 'block';
            infoHojaDiv.innerHTML = '';
            cargandoMensajeDiv.style.display = 'none';
            return;
        }

        // Limpiar resultados anteriores y mensajes
        infoHojaDiv.innerHTML = '';
        errorMensajeDiv.style.display = 'none';
        cargandoMensajeDiv.style.display = 'block';

        const encodedSheetName = encodeURIComponent(nombreHojaBuscada);
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodedSheetName}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error de red: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                cargandoMensajeDiv.style.display = 'none';
                const jsonString = data.substring(data.indexOf('(') + 1, data.lastIndexOf(')'));
                let jsonData;
                try {
                    jsonData = JSON.parse(jsonString);
                } catch (e) {
                    console.error('Error al parsear JSON:', e, "\nRespuesta original:", data);
                    errorMensajeDiv.textContent = `Error al procesar los datos de la hoja "${nombreHojaBuscada}". La respuesta no es un JSON válido. Verifique la consola para más detalles.`;
                    errorMensajeDiv.style.display = 'block';
                    return;
                }

                if (jsonData.status === 'error') {
                    console.error('Error de la API de Google Sheets:', jsonData.errors);
                    let mensajeErrorUsuario = `Error al cargar la hoja "${nombreHojaBuscada}". `;
                    if (jsonData.errors && jsonData.errors.length > 0) {
                        mensajeErrorUsuario += `Detalle: ${jsonData.errors[0].detailed_message || jsonData.errors[0].message}`;
                         if (jsonData.errors[0].reason === 'sheet_name_not_found'){
                             mensajeErrorUsuario = `La hoja con nombre "${nombreHojaBuscada}" no fue encontrada en el documento. Verifique el nombre e inténtelo de nuevo.`
                         }
                    } else {
                        mensajeErrorUsuario += "Verifique que el nombre de la hoja sea correcto y que el documento esté publicado.";
                    }
                    errorMensajeDiv.textContent = mensajeErrorUsuario;
                    errorMensajeDiv.style.display = 'block';
                    return;
                }

                if (!jsonData.table || !jsonData.table.cols || !jsonData.table.rows) {
                    errorMensajeDiv.textContent = `La hoja "${nombreHojaBuscada}" parece estar vacía o no tiene el formato de tabla esperado.`;
                    errorMensajeDiv.style.display = 'block';
                    return;
                }

                const cols = jsonData.table.cols;
                const rows = jsonData.table.rows;

                console.log("Datos JSON:", jsonData);
                console.log("Columnas:", cols);
                console.log("Filas:", rows);

                const table = document.createElement('table');
                const thead = document.createElement('thead');
                const tbody = document.createElement('tbody');
                const headerRow = document.createElement('tr');

                cols.forEach(col => {
                    const th = document.createElement('th');
                    th.textContent = col.label || '';
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                table.appendChild(thead);

                rows.forEach(rowData => {
                    const tr = document.createElement('tr');
                    if (rowData.c) {
                        for (let i = 0; i < cols.length; i++) {
                            const cellData = rowData.c[i];
                            const td = document.createElement('td');
                            td.textContent = cellData ? (cellData.f !== undefined ? cellData.f : (cellData.v !== undefined ? cellData.v : '')) : '';
                            tr.appendChild(td);
                        }
                    }
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                infoHojaDiv.appendChild(table);

            })
            .catch(error => {
                cargandoMensajeDiv.style.display = 'none';
                console.error('Error en la solicitud fetch:', error);
                errorMensajeDiv.textContent = `Ocurrió un error al cargar la hoja "${nombreHojaBuscada}". Detalles: ${error.message}. Verifique la consola del navegador.`;
                errorMensajeDiv.style.display = 'block';
            });
    });
});
