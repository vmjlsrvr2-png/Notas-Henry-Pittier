(async () => {
  const activoData = await API.periodos.obtenerActivo();
  const idAnio = activoData?.anio?.id_anio;

  if (!idAnio) {
    document.getElementById("seccionesTabla").innerHTML =
      `<div class="alert alert-warning">No hay año escolar activo</div>`;
    return;
  }

  const seccionesData = await API.secciones.listar({ anio_escolar_id: idAnio });
  const secciones = Array.isArray(seccionesData) ? seccionesData : seccionesData?.items || [];

  const contenedor = document.getElementById("seccionesTabla");

  const tabla = document.createElement("table");
  tabla.className = "table table-striped table-sm";

  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Año</th>
        <th>Sección</th>
        <th>Mención</th>
        <th>Turno</th>
        <th>Activo</th>
      </tr>
    </thead>
    <tbody>
      ${secciones
        .map(
          (s) => `
        <tr>
          <td>${s.anio_escolar_nombre ?? "—"}</td>
          <td>${s.nombre}</td>
          <td>${s.mencion ?? "—"}</td>
          <td>${s.turno ?? "—"}</td>
          <td>${s.activo ? "Sí" : "No"}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;

  contenedor.innerHTML = "";
  contenedor.appendChild(tabla);
})();
