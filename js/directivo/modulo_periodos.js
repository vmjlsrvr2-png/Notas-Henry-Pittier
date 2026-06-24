(async () => {
  const token = window.tokenGlobal;

  const periodos = await API.periodos.listarAnios();

  if (!periodos) {
    document.getElementById("periodosTabla").innerHTML =
      `<div class="alert alert-danger">Error cargando períodos académicos</div>`;
    return;
  }

  const periodos = periodos || []; 

  const contenedor = document.getElementById("periodosTabla");

  const tabla = document.createElement("table");
  tabla.className = "table table-striped table-sm";

  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Año escolar</th>
        <th>Activo</th>
      </tr>
    </thead>
    <tbody>
      ${periodos.items
        .map(
          (p) => `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.anio_escolar_nombre ?? "—"}</td>
          <td>${p.activo ? "Sí" : "No"}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;

  contenedor.innerHTML = "";
  contenedor.appendChild(tabla);
})();
