// pages/api/contact.js
import axios from "axios";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      id,
      customerName,
      customerContact,
      startLocation,
      endLocation,
      distance,
      price,
      bookingDate,
    } = req.body;

    // Replace with your actual bot token and chat ID
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const encodedStart = encodeURIComponent(startLocation);
    const encodedEnd = encodeURIComponent(endLocation);
    const mapsUrl = `https://www.google.com/maps/dir/${encodedStart}/${encodedEnd}`;

    const formatPhoneNumber = (contactNumber) => {
      // 1. Remove all spaces from the string
      let formattedNumber = contactNumber.replace(/ /g, "");

      // 2. If the string does not start with '+65', add it
      if (!formattedNumber.startsWith("+")) {
        formattedNumber = "+65" + formattedNumber;
      }

      return formattedNumber;
    };

    const MarkdownV2Parser = (text) => {
      return text.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, "\\$&");;
    };
    const formattedCustomerContact = formatPhoneNumber(customerContact)
    const text = `
New Booking from ${MarkdownV2Parser(customerName)}
Contact: [${MarkdownV2Parser(formattedCustomerContact)}](tel:${MarkdownV2Parser(formattedCustomerContact)})

Start: ${MarkdownV2Parser(startLocation)} 

End Location: ${MarkdownV2Parser(endLocation)} 

Distance: ${MarkdownV2Parser(distance.toString())}KM

Price: $${price}

Booking Date: ${MarkdownV2Parser(bookingDate)}

URL: ${MarkdownV2Parser(mapsUrl)}

ID : ${MarkdownV2Parser(id)}
    `;

    try {
      console.log(text)
      // Send the message via the Telegram Bot API
      const response1 = await axios.post(telegramUrl, {
        chat_id: chatId,
        text: text,
        parse_mode: "MarkdownV2",
      });
      if (response1.data.ok) {
        return res
          .status(200)
          .json({ success: true, message: "Message sent successfully!" });
      } else {
        return res
          .status(500)
          .json({ success: false, message: "Failed to send message." });
      }
    } catch (error) {
      console.error("Error sending message to Telegram:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error sending message." });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
