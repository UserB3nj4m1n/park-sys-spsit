const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true, 
  auth: {
    user: 'noreply@parkwise.store',
    pass: 'sockaspsit123654'
  }
});

async function sendBookingConfirmation(bookingDetails) {
  const { email, licensePlate, booking_date, startTime, endTime, total_price, cancellation_token, slot_name } = bookingDetails;

  const cancellationUrl = `http://parkwise.store:3000/api/bookings/cancel/${cancellation_token}`;

  const mailOptions = {
    from: '"ParkWise" <noreply@parkwise.store>',
    to: email,
    subject: 'Your Parking Reservation Confirmation',
    html: `
      <h1>Booking Confirmation</h1>
      <p>Thank you for your reservation at ParkWise!</p>
      <h2>Invoice</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <td><b>License Plate:</b></td>
          <td>${licensePlate}</td>
        </tr>
        <tr>
          <td><b>Parking Slot:</b></td>
          <td>${slot_name}</td>
        </tr>
        <tr>
          <td><b>Date:</b></td>
          <td>${booking_date}</td>
        </tr>
        <tr>
          <td><b>Time:</b></td>
          <td>${startTime} - ${endTime}</td>
        </tr>
        <tr>
          <td><b>Total Price:</b></td>
          <td>€${total_price.toFixed(2)}</td>
        </tr>
      </table>
      <p>
        If you need to cancel your reservation, please click the link below:
      </p>
      <a href="${cancellationUrl}">Cancel Reservation</a>
      <p>Thank you for choosing ParkWise!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = { sendBookingConfirmation };
