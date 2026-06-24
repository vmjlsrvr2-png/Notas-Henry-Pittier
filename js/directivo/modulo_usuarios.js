(async () => {
  const usuariosData = await API.usuarios.listar({ page: 1, per_page: 50 });
  const usuarios = Array.isArray(usuariosData) ? usuariosData : usuariosData?.items || [];

  const contenedor = document.getElementById("usuariosTabla");

  const tabla = document.createElement("table");
  tabla.className = "table table-striped table-sm";

  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Username</th>
        <th>Nombres</th>
        <th>Apellidos</th>
        <th>Cédula</th>
        <th>Activo</th>
        <th>Rol</th>
      </tr>
    </thead>
    <tbody>
      ${usuarios
        .map(
          (u) => `
        <tr>
          <td>${u.username}</td>
          <td>${u.nombres}</td>
          <td>${u.apellidos}</td>
          <td>${u.cedula ?? "—"}</td>
          <td>${u.activo ? "Sí" : "No"}</td>
          <td>${u.rol ?? "—"}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;

  contenedor.innerHTML = "";
  contenedor.appendChild(tabla);
})();
