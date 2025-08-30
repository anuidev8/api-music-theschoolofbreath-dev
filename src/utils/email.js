const { Resend } = require("resend");
const { resendKey, sendEmail, receiveEmail } = require("../configs/vars");

module.exports = async (data) => {
  const resend = new Resend(resendKey);
  let subject  = "Mensaje de Contacto"
  let info = `<div><h1>Mensaje de Contacto</h1>
  <p>Nombre: ${data.name}</p>
  <p>Teléfono: ${data.phone}</p>
  <p>Email: ${data.email}</p>
  <p>Mensaje: ${data.message}</p>
  </div>`
  if (data.type) {
    subject = "Suscripción"
    info = `<div><h1>Suscripción</h1> <p>Email: ${data.email}</p></div>`
  }
  try {

    let result = await resend.emails.send({
      from: sendEmail,
      to: receiveEmail,
      subject:subject ,
      html: info,

    });
    console.log(result)
  } catch (error) {
    console.log(error)
  }
  return true
};
