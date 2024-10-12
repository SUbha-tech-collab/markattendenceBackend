const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors());

let OTP;

function generateOTP() {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000);
  console.log(otp);
  return otp;
}

function sendMail(email) {
  OTP = generateOTP();
  const HTMLContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #333;">OTP to verify Email for MarkYourAttencence</h2><p style="font-size: 16px;">Your OTP (One-Time Password) for verification is:</p><h1 style="font-size: 36px; color: #007bff; margin-bottom: 20px;">${OTP}</h1><p style="font-size: 14px; color: #666;">This OTP is valid for a single use and should not be shared with anyone.</p><p style="font-size: 14px; color: #666;">If you did not request this OTP, please ignore this email.</p></div>`;

  let mailOptions = {
    from: "mahajansubha610@gmail.com",
    to: email,
    subject: `Email Verfication Code -> ${OTP}`,
    html: HTMLContent,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return "404";
    } else {
      console.log("Email sent: " + info.response);
      return "250";
    }
  });
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use SSL
  auth: {
    user: process.env.SenderEMail,
    pass: process.env.SenderEmailPass,
  },
});

// // Database configuration
// const dbConfig = {
//   connectionLimit: 10, // Maximum number of connections in the pool
//   host: "localhost",
//   database: "userschema",
//   user: "root",
//   password: "Subha29",
// };

// Database configuration for remote MySQL
const dbConfig = {
  connectionLimit: 10, // Maximum number of connections in the pool
  host: "sql12.freemysqlhosting.net", // Remote MySQL host
  port: 3306, // MySQL port number
  database: "sql12737044", // Name of the database
  user: "sql12737044", // Username for the database
  password: "EYucusWht6", // Password for the database
};

module.exports = dbConfig;


// Create connection pool
const pool = mysql.createPool(dbConfig);

app.get("/", (req, res) => {
  res.send("MarkAttendence Server is running successfully");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  console.log("Email -> ", email);
  console.log("Password-> ", password);

  const sql = "select iduser, password, name, role from user where iduser= ?";

  // Get connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection from pool:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    console.log("Connected to MySQL");

    // Execute the query
    connection.query(sql, email, (err, data) => {
      connection.release(); // Release the connection back to the pool

      if (err) {
        console.error("Error querying MySQL:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Login Successful");
      console.log(data);

      if (data.length > 0) {
        bcrypt.compare(password, data[0].password, (err, result) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return res.status(500).json({ error: "Internal Server Error" });
          }

          if (result) {
            console.log("Login successful");
            return res.status(200).json({ data: data });
          } else {
            console.log("Invalid password");
            return res.status(500).json({ error: "Invalid credentials" });
          }
        });
      } else {
        return res.status(500).json({ error: "Invalid credentials" });
      }
    });
  });
});

app.post("/user", (req, res) => {
  console.log("In /user url");

  console.log(req.body);

  const { email } = req.body;

  console.log("Email -> ", email);

  const sql = "select iduser, name, role from user where iduser= ?";
  const dateFetch =
    "select date, start_time, end_time, status from attendence_table where userid = ?";

  // Get connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection from pool:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    console.log("Connected to MySQL");

    // Execute the query
    connection.query(sql, [email], (err, data) => {
      connection.release(); // Release the connection back to the pool

      if (err) {
        console.error("Error querying MySQL:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Login Successful");
      console.log(data);

      if (data.length > 0) {
        // if (result) {
        console.log("Login successful");
        connection.query(dateFetch, [email], (err, dateDetails) => {
          if (err) {
            console.error(
              "Error querying MYSQL for fetching the attendence dates:",
              err
            );
            return res
              .status(500)
              .json({ error: "Internal server error to fetch the dates" });
          } else {
            console.log(dateDetails);
            return res
              .status(200)
              .json({ dateDetails: dateDetails, data: data });
          }
        });
        // } else {
        //   console.log("Invalid password");
        //   return res.status(500).json({ error: "Invalid credentials" });
        // }
      } else {
        return res.status(500).json({ error: "Invalid credentials" });
      }
    });
  });
});

app.post("/alluser", (req, res) => {
  //   console.log(req.body);

  const { admin } = req.body;

  const sql = "select iduser, name, role from user";
  // Get connection from the pool
  if (admin) {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting MySQL connection from pool:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Connected to MySQL");

      // Execute the query
      connection.query(sql, (err, data) => {
        connection.release(); // Release the connection back to the pool

        if (err) {
          console.error("Error querying MySQL:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        console.log("Admin Connection Successful");
        console.log(data);
        return res.status(200).json({ data: data });
      });
    });
  }
});

app.post("/signup", (req, res) => {
  var name = req.body.name.trim().replace(/\s+/g, " ");
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    const sql =
      "insert into user (iduser, password, name, role) values (?,?,?,?)";
    const values = [req.body.email, hashedPassword, name, "user"];

    // Get connection from the pool
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting MySQL connection from pool:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Connected to MySQL");

      // Execute the query
      connection.query(sql, values, (err, result) => {
        connection.release(); // Release the connection back to the pool

        if (err) {
          console.error("Error querying MySQL:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        console.log("Insertion Successful");
        console.log(result);

        return res.status(200).json({ message: "User created successfully" });
      });
    });
  });
});

app.post("/attendence", (req, res) => {
  const { email, value, timeRange } = req.body;

  let inputs = [];

  for (let i = 0; i < req.body.value.length; i++) {
    inputs.push([
      email,
      value[i].substr(0, 8) + (parseInt(value[i].substr(8, 2)) + 1),
      timeRange[i][0],
      timeRange[i][1],
      'CURRENT_TIMESTAMP',
      'CURRENT_TIMESTAMP'
    ]);
  }
  const sql =
    "insert into attendence_table (userid, date, start_time, end_time, marking_time, modify_time) values ?";

  // Get connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection from pool:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    console.log("Connected to MySQL");

    // Execute the query
    connection.query(sql, [inputs], (err, result) => {
      connection.release(); // Release the connection back to the pool

      if (err) {
        console.error("Error querying MySQL:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Insertion Successful");
      console.log(result);

      return res
        .status(200)
        .json({ message: "Attendence recorded successfully" });
    });
  });
});

app.post("/edittime", (req, res) => {

  const { email, date, timeRange } = req.body;

  let inputs = [
    timeRange[0],
    timeRange[1],
    email,
    date.substr(0, 8) + (parseInt(date.substr(8, 2)) + 1),
  ];

  const sql =
    "update attendence_table set start_time = ?, end_time = ?, modify_time = now() where userid = ? and date(date) = ?";

  // Get connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection from pool:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    console.log("Connected to MySQL");

    // Execute the query
    connection.query(sql, inputs, (err, result) => {
      connection.release(); // Release the connection back to the pool

      if (err) {
        console.error("Error querying MySQL:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Modification Successful");
      console.log(result);

      return res
        .status(200)
        .json({ message: "Attendence recorded successfully" });
    });
  });
});

app.post("/delete", (req, res) => {
  const { email, date } = req.body;

  if (date.length == 0)
    return res.status(500).json({ error: "No Date is selected to delete" });

  const formattedDates = date.map((item) => {
    let datePart = item.substr(0, 8);
    let day = parseInt(item.substr(8, 2)) + 1;
    return datePart + (day < 10 ? "0" + day : day);
  });

  let inputs = [email];
  const sql =
    "delete from attendence_table where userid = ? and date(date) in ('" + formatteddates.join("','") +"')";

  // Get connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection from pool:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    console.log("Connected to MySQL");

    // Execute the query
    connection.query(sql, inputs, (err, result) => {
      connection.release(); // Release the connection back to the pool

      if (err) {
        console.error("Error querying MySQL:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Deletion Successful");
      console.log(result);

      return res
        .status(200)
        .json({ message: "Attendence recorded successfully" });
    });
  });
});

app.post("/approve", (req, res) => {
  const { email, date } = req.body;

  if (date.length == 0)
    return res.status(500).json({ error: "No Date is selected to approve" });

  const formattedDates = date.map((item) => {
    let datePart = item.substr(0, 8);
    let day = parseInt(item.substr(8, 2)) + 1; // increment day by 1
    return datePart + (day < 10 ? "0" + day : day); // handle single-digit day properly
  });

  let inputs = [email];
  const sql =
    "update attendence_table set status = 'approve', approve_time = now() where userid = ? and date(date) in ('" + formatteddates.join("','") + "')";

  // Get connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection from pool:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    console.log("Connected to MySQL");

    // Execute the query
    connection.query(sql, inputs, (err, result) => {
      connection.release(); // Release the connection back to the pool

      if (err) {
        console.error("Error querying MySQL:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Updation Successful");
      console.log(result);

      return res
        .status(200)
        .json({ message: "Attendence updated successfully" });
    });
  });
});

app.post("/namechange", (req, res) => {
  const { name, email } = req.body;

  let inputs = [name, email];
  const sql = "update user set name = ? where iduser = ?";

  // Get connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection from pool:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    console.log("Connected to MySQL");

    // Execute the query
    connection.query(sql, inputs, (err, result) => {
      connection.release(); // Release the connection back to the pool

      if (err) {
        console.error("Error querying MySQL:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Updation Successful");
      console.log(result);

      return res.status(200).json({ message: "Name updated successfully" });
    });
  });
});

app.post("/reject", (req, res) => {
  const { email, date } = req.body;

  if (date.length == 0)
    return res.status(500).json({ error: "No Date is selected to approve" });

  const formattedDates = date.map((item) => {
    let datePart = item.substr(0, 8);
    let day = parseInt(item.substr(8, 2)) + 1;
    return datePart + (day < 10 ? "0" + day : day);
  });

  let inputs = [email];
  const sql =
    "update attendence_table set status = 'reject', approve_time = now() where userid = ? and date(date) in ('" + formatteddates.join("','") + "')";

  // Get connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection from pool:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    console.log("Connected to MySQL");

    // Execute the query
    connection.query(sql, inputs, (err, result) => {
      connection.release(); // Release the connection back to the pool

      if (err) {
        console.error("Error querying MySQL:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Updation Successful");
      console.log(result);

      return res
        .status(200)
        .json({ message: "Attendence updated successfully" });
    });
  });
});

app.post("/emailcheck", (req, res) => {

  const { email } = req.body;
  const sql = "select count(*) as count from user where iduser = ?";

  // Get connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection from pool:", err);
      return res.status(404).json({ error: "Internal Server Error" });
    }

    console.log("Connected to MySQL");

    // Execute the query
    connection.query(sql, email, (err, result) => {
      connection.release(); // Release the connection back to the pool

      if (err) {
        console.error("Error querying MySQL:", err);
        return res.status(404).json({ error: "Internal Server Error" });
      }

      console.log(result[0].count);
      if (result[0].count === 0)
        return res
          .status(500)
          .json({ error: "This email is not registered with us." });

      const mailStatus = sendMail(email);
      if (mailStatus == "404") {
        sendMail(email);
      }

      return res
        .status(200)
        .json({ error: "OTP send to the verified email address" });
    });
  });
});

app.post("/resendOTP", (req, res) => {
  const { email } = req.body;
  OTP = generateOTP();
  const mailStatus = sendMail(email);
  if (mailStatus == "404") {
    sendMail(email);
  }

  return res.status(200);
});

app.post("/otpcheck", (req, res) => {
  const { otp } = req.body;

  console.log(otp, OTP);

  if (otp == OTP) {
    OTP = undefined;
    return res.status(200).json("Otp verified successfully");
  } else return res.status(500).json("Wrong otp is entered");
});

app.listen(4000, () => {
  console.log("Listening on port 4000...");
});
