import express, { Router, Request, Response } from "express";
import { connectToDatabase } from "../database/dbconnection.js";
import sql from "mssql";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = Router();

// GET METHOD: Fetch loanDetails for Accounting and OSDS
router.get(
  "/loanApplication/loanDetails",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const pool = await connectToDatabase();
      const result = await pool.request().query(`
            SELECT 
            ld.loan_details_id,
            ld.loan_amount,
            ld.type_of_loan,
            ld.term,
            ld.loan_application_number,
            ld.purpose,
            ld.borrowers_agreement,
            ld.co_makers_agreement,
            ld.applicant_id,
            ld.application_id,
            ld.date_submitted,
            a.last_name,
            a.first_name,
            a.middle_name,
            la.is_approved_osds
            FROM tbl_Loan_Application la
            JOIN tbl_Loan_Details ld
            ON la.application_id = ld.application_id
            JOIN tbl_Applicant a
            ON la.applicant_id = a.applicant_id;
        `);

      if (result.recordset.length > 0) {
        res.status(200).json(result.recordset);
      } else {
        res.status(404).json({ message: "No Loan Details found" });
      }
    } catch (error) {
      console.error("Failed to retrieve users:", error);
      res.status(500).json({ message: "Failed to retrieve users", error });
    }
  }
);

// GET METHOD: Fetch getLoanApplication2 - To not mess with other call
router.get(
  "/loanApplication/getLoanApplicationAccounting",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const pool = await connectToDatabase();
      const result = await pool.request().query(`
            WITH RankedStatuses AS (
            SELECT 
                LA.amount amount,
                LA.loan_type loan_type,
                LA.application_date application_date,
                LA.applicant_id applicant_id,
                LD.purpose purpose, 
                APP.first_name first_name,
                APP.last_name last_name,
                O.department_name department_name,
                ApS.*,
                ROW_NUMBER() OVER (PARTITION BY ApS.application_id ORDER BY O.sequence_order ASC) AS rn
            FROM tbl_Loan_Application LA
            JOIN tbl_Applicant APP
            ON LA.applicant_id = APP.applicant_id
            JOIN tbl_department_status ApS
            ON LA.application_id = ApS.application_id
            JOIN tbl_Department O
            ON Aps.department_id = O.department_id
            JOIN tbl_Loan_Details LD
            ON LA.application_ID = LD.application_id 
            WHERE ApS.status = 'Pending'
            )

            SELECT application_id, status, department_name, amount, loan_type, application_date, first_name, last_name, applicant_id, purpose
            FROM RankedStatuses
            WHERE rn = 1
            ORDER BY application_id;
        `);

      if (result.recordset.length > 0) {
        res.status(200).json(result.recordset);
      } else {
        res
          .status(404)
          .json({ message: "No Loan Applications for Accounting found" });
      }
    } catch (error) {
      console.error("Failed to retrieve users:", error);
      res.status(500).json({ message: "Failed to retrieve users", error });
    }
  }
);

// GET METHOD: Fetch getPaidApplication
router.get(
  "/loanApplication/getPaidApplication",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const pool = await connectToDatabase();
      const result = await pool.request().query(`
            SELECT 
                LA.amount amount,
                LA.loan_type loan_type,
                LA.application_date application_date,
                LA.applicant_id applicant_id,
                LA.application_id,
                LD.purpose purpose, 
                APP.first_name first_name,
                APP.last_name last_name,
                O.department_name,
                ApS.status,
                ApS.updated_at paid_date
                FROM tbl_Loan_Application LA
                JOIN tbl_Applicant APP
                ON LA.applicant_id = APP.applicant_id
                JOIN tbl_department_status ApS
                ON LA.application_id = ApS.application_id
                JOIN tbl_department O
                ON Aps.department_id = O.department_id
                JOIN tbl_Loan_Details LD
                ON LA.application_ID = LD.application_id 
                WHERE ApS.status = 'Paid' AND o.department_name = 'Payment';
        `);

      if (result.recordset.length > 0) {
        res.status(200).json(result.recordset);
      } else {
        res
          .status(200)
          .json({ message: "No Loan Applications for Accounting found" });
      }
    } catch (error) {
      console.error("Failed to retrieve users:", error);
      res.status(500).json({ message: "Failed to retrieve users", error });
    }
  }
);

// GET METHOD: Fetch getCurrentLoanApplication by applicantId
router.get(
  "/loanApplication/currentLoanApplication/:applicantId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { applicant_id } = req.params;

      const pool = await connectToDatabase();

      const loanQuery = `
            SELECT TOP 1 * 
            FROM tbl_Loan_Application 
            WHERE status = 'Pending' AND applicant_id = @applicant_id
            ORDER BY application_date DESC;
        `;

      const loanResult = await pool
        .request()
        .input("applicant_id", applicant_id)
        .query(loanQuery);

      if (loanResult.recordset.length === 0) {
        return res
          .status(200)
          .json({
            success: true,
            message: { currentLoan: null, currentHistory: null },
          });
      }

      const application_id = loanResult.recordset[0].application_id;

      const historyQuery = `
            SELECT TOP 1 * 
            FROM tbl_application_status_history
            WHERE application_id = @application_id
            ORDER BY history_date DESC;
        `;

      const historyResult = await pool
        .request()
        .input("application_id", application_id)
        .query(historyQuery);

      return res.status(200).json({
        success: true,
        message: {
          currentLoan: loanResult.recordset[0],
          currentHistory:
            historyResult.recordset.length > 0
              ? historyResult.recordset[0]
              : null,
        },
      });
    } catch (error) {
      console.error("Error fetching current loan application:", error);
      res
        .status(500)
        .json({
          message: "Failed to retrieve current loan application: ",
          error,
        });
    }
  }
);

// GET METHOD: Fetch loanApplicationStatus by applicantId
router.get(
  "/loanApplication/LoanApplicationStatus/:applicantId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { applicantId } = req.params;

      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("applicant_id", sql.Int, applicantId).query(`
                    SELECT * FROM tbl_Loan_Application LA
                    JOIN tbl_department_status OS
                    ON LA.application_id = OS.application_id
                    WHERE LA.status = 'Pending' AND LA.applicant_id = @applicant_id;
            `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Failed to get loan application status:", error);
      res
        .status(500)
        .json({
          message: "Failed to retrieve loan application status: ",
          error,
        });
    }
  }
);

// GET METHOD: Fetch loanHistory by applicantId
router.get(
  "/loanApplication/loanHistory/:applicantId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { applicantId } = req.params;

      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("applicant_id", sql.Int, applicantId).query(`
                    SELECT 
                    LA.application_id, 
                    LA.application_date, 
                    LA.is_qualified, 
                    LA.amount,
                    LD.loan_application_number
                    FROM tbl_Loan_Application as LA
                    JOIN tbl_Loan_Details LD
                    ON LA.application_id=LD.application_id
                    WHERE LA.applicant_id = @applicant_id;
            `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Failed to get loan application history:", error);
      res
        .status(500)
        .json({
          message: "Failed to retrieve loan application history: ",
          error,
        });
    }
  }
);

// GET METHOD: Fetch officeStatus by applicantId
router.get(
  "/loanApplication/officeStatus/:applicantId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { applicantId } = req.params;

      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("applicant_id", sql.Int, applicantId).query(`
                    SELECT TOP 9
                    LA.application_id,
                    OS.status,
                    OS.updated_at,
                    O.department_name,
                    O.sequence_order
                    FROM tbl_Loan_Application LA
                    JOIN tbl_department_status OS
                    ON LA.application_id = OS.application_id
                    JOIN tbl_Department O
                    ON OS.department_id = O.department_id 
                    WHERE LA.status = 'Pending' AND LA.applicant_id = @applicant_id
                    ORDER BY LA.applicant_id DESC;
                    `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Failed to get loan application history:", error);
      res
        .status(500)
        .json({
          message: "Failed to retrieve loan application history: ",
          error,
        });
    }
  }
);

// GET METHOD: Fetch departmentStatus by departmentId
router.get(
  "/loanApplication/getDepartmentStatus/:departmentId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { departmentId } = req.params;

      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("departmentId", sql.Int, departmentId).query(`
                SELECT * FROM tbl_department_status
                WHERE department_id = @departmentId;
            `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Failed to get department status:", error);
      res
        .status(500)
        .json({ message: "Failed to retrieve department status: ", error });
    }
  }
);

// GET METHOD: Fetch borrowersInformation by applicationId
router.get(
  "/loanApplication/borrowersInformationById/:applicationId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { applicationId } = req.params;

      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("application_id", sql.Int, applicationId).query(`
                SELECT * FROM [tbl_Borrowers_Information]
                WHERE application_id = @application_id
            `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Failed to get Co Makers Information:", error);
      res
        .status(500)
        .json({ message: "Failed to retrieve Co Makers Informatio: ", error });
    }
  }
);

// GET METHOD: Fetch coMakersInformationById by applicationId
router.get(
  "/loanApplication/coMakersInformationById/:applicationId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { applicationId } = req.params;

      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("application_id", sql.Int, applicationId).query(`
                SELECT * FROM [tbl_Co_Makers_Information]
                WHERE application_id = @application_id
            `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Failed to get Co Makers Information:", error);
      res
        .status(500)
        .json({ message: "Failed to retrieve Co Makers Information: ", error });
    }
  }
);

// GET METHOD: Fetch assessmentDetailsById by applicationId
router.get(
  "/loanApplication/getAssessmentDetailsById/:applicationId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { applicationId } = req.params;

      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("application_id", sql.Int, applicationId).query(`
                SELECT * FROM [sdo_accounting].[dbo].[tbl_Assessment_Form] WHERE application_id = @application_id
            `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Failed to get assessment form:", error);
      res
        .status(500)
        .json({ message: "Failed to retrieve assessment form: ", error });
    }
  }
);

// GET METHOD: Fetch getApplicant by applicantId
router.get(
  "/loanApplication/getApplicant/:applicantId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { applicantId } = req.params;

      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("applicantId", sql.Int, applicantId).query(`
                SELECT  [applicant_id],
                        [first_name],
                        [middle_name],
                        [last_name],
                        [ext_name],
                        [email],
                        [institution_name],
                        [position_id],
                        [emp_status],
                        [designation]
                FROM [tbl_Applicant]
                WHERE applicant_id = @applicantId
            `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Failed to get assessment form:", error);
      res
        .status(500)
        .json({ message: "Failed to retrieve assessment form: ", error });
    }
  }
);

// GET METHOD: Fetch User by Email
router.get(
  "/users/email/:email/:table/:id_type",
  async (req: Request, res: Response): Promise<any> => {
    const { email, table, id_type } = req.params;
    try {
      const pool = await connectToDatabase();
      const result = await pool.request().input("email", sql.VarChar, email)
        .query(`
                SELECT password, ${id_type} FROM ${table}
                WHERE email = @email;
            `);

      const user = result.recordset[0];
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Failed to retrieve user:", error);
      res.status(500).json({ message: "Failed to retrieve user", error });
    }
  }
);

// GET METHOD: Fetch User Profile
router.get(
  "/users/profile/:role/:id",
  async (req: Request, res: Response): Promise<any> => {
    const { role, id } = req.params;

    try {
      const pool = await connectToDatabase();
      let query = "";

      if (role === "applicant") {
        query = `
                SELECT
                app.applicant_id,
                app.email, 
                app.first_name, 
                app.middle_name, 
                app.last_name, 
                app.ext_name,
                app.designation
                FROM tbl_Applicant app
                WHERE app.applicant_id = @id;
            `;
      } else {
        query = `
                SELECT
                sta.staff_id,
                sta.email, 
                sta.first_name, 
                sta.middle_name, 
                sta.last_name, 
                sta.ext_name,
                dept.department_name
                FROM tbl_Staff sta
                JOIN tbl_Department dept
                ON sta.department_id = dept.department_id
                WHERE sta.staff_id = @id;
            `;
      }

      const result = await pool.request().input("id", sql.Int, id).query(query);

      const profile = result.recordset[0];
      if (profile) {
        res.status(200).json(profile);
      } else {
        res.status(404).json({ message: "Profile not found" });
      }
    } catch (error) {
      console.error("Failed to retrieve profile:", error);
      res.status(500).json({ message: "Failed to retrieve profile", error });
    }
  }
);

// POST METHOD: User Login
router.post("/login", async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const pool = await connectToDatabase();
    const result = await pool.request().input("email", sql.VarChar, email)
      .query(`
                SELECT staff_id, first_name, last_name, email, password, department_id 
                FROM tbl_Staff 
                WHERE email = @email;
            `);

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = generateJWT(
      user.staff_id,
      user.first_name,
      user.last_name,
      user.email,
      user.department_id
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      role: user.department_id,
    });
  } catch (error) {
    console.error("Failed to login user:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error,
    });
  }
});

const generateJWT = (
  staff_id: number,
  first_name: string,
  last_name: string,
  email: string,
  role: string
) => {
  const JWT_SECRET = process.env.SECRET_KEY || "tokentest";

  const payload = {
    iss: "localhost",
    aud: "localhost",
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    data: {
      staff_id,
      first_name,
      last_name,
      email,
      role,
    },
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256" });
};

// POST METHOD: Add User
router.post("/users", async (req: Request, res: Response): Promise<any> => {
  const {
    first_name,
    middle_name,
    last_name,
    ext_name,
    email,
    institution_name,
    position_id,
    emp_status,
    designation,
    password,
  } = req.body;

  if (
    !first_name ||
    !last_name ||
    !email ||
    !institution_name ||
    !position_id ||
    !emp_status ||
    !designation ||
    !password
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input("first_name", sql.VarChar, first_name)
      .input("middle_name", sql.VarChar, middle_name)
      .input("last_name", sql.VarChar, last_name)
      .input("ext_name", sql.VarChar, ext_name)
      .input("email", sql.VarChar, email)
      .input("institution_name", sql.VarChar, institution_name)
      .input("position_id", sql.Int, position_id)
      .input("emp_status", sql.VarChar, emp_status)
      .input("designation", sql.VarChar, designation)
      .input("password", sql.VarChar, password).query(`
                INSERT INTO [sdo_accounting].[dbo].[tbl_Applicant] 
                ([first_name], [middle_name], [last_name], [ext_name], [email], [institution_name], [position_id], [emp_status], [designation], [password])
                VALUES (@first_name, @middle_name, @last_name, @ext_name, @email, @institution_name, @position_id, @emp_status, @designation, @password)
            `);

    res
      .status(201)
      .json({ message: "User added successfully", user: req.body });
  } catch (error) {
    console.error("Failed to add user:", error);
    res.status(500).json({ message: "Failed to add user", error });
  }
});

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Global object to hold file paths (mimicking $this->filePaths)
let filePaths: { [key: string]: string } = {};

// Helper function to get a file path by key
function getFilePath(key: string): string | null {
  return filePaths[key] || null;
}

async function fileServiceSaveFile(
  application_id: number,
  applicant_id: number,
  files: any
): Promise<void> {
  try {
    // TODO: add validation only pdf file is allowed

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const fileUploadLocation = path.join(
      __dirname,
      "/../../uploads/applicant/"
    );
    const outputFolder = path.join(fileUploadLocation, String(applicant_id));
    const filePathDir = path.join(
      outputFolder,
      "documents",
      String(application_id)
    );

    if (!fs.existsSync(filePathDir)) {
      fs.mkdirSync(filePathDir, { recursive: true });
    }

    // This line from PHP: 'http://localhost/sdo_api_v1/applicant/1/documents/1010/authorityToDeduct.pdf';
    // Lol fix this
    const absFilePath = `/../uploads/applicant/${applicant_id}/documents/${application_id}/`;

    // Loop through each file in req.files
    for (const key in files) {
      if (Object.prototype.hasOwnProperty.call(files, key)) {
        try {
          const fileArray = files[key];
          // Assuming one file per field, get the first file:
          const file = fileArray[0];
          const currentFilePath = path.join(filePathDir, `${key}.pdf`);
          const tempPath = absFilePath + `${key}.pdf`;

          // If the file has a buffer (memory storage), write it to disk.
          if (file.buffer) {
            fs.writeFileSync(currentFilePath, file.buffer);
          } else if (file.path) {
            // Fallback if file.path exists (e.g., if using disk storage)
            fs.renameSync(file.path, currentFilePath);
          } else {
            throw new Error(`No file data available for ${key}`);
          }
          // Store the relative URL or path
          filePaths[key] = tempPath;
        } catch (error) {
          console.error("Failed to save file:", error);
          throw error;
        }
      }
    }
  } catch (error) {
    console.error("File service error:", error);
    throw error;
  }
}

async function updateLoanStatusHistory(
  initiator: string,
  application_id: number,
  transaction: sql.Transaction
): Promise<void> {
  try {
    let remarkMsg = "";
    switch (initiator.toLowerCase()) {
      case "applicant":
        remarkMsg = "Submitted to OSDS";
        break;
      case "osds":
        remarkMsg = "Forwarded to Accounting";
        break;
      case "accounting":
        remarkMsg = "For Assessment";
        break;
      case "secretariat":
        remarkMsg = "For Signature";
        break;
      case "hr":
        remarkMsg = "For Signature";
        break;
      case "admin":
        remarkMsg = "For Signature";
        break;
      case "legal":
        remarkMsg = "For Endorsement";
        break;
      case "asds":
        remarkMsg = "For Endorsement";
        break;
      case "sds":
        remarkMsg = "For Payment Process";
        break;
      case "payment":
        remarkMsg = "Payment Confirm";
        break;
    }

    const query = `
                INSERT INTO tbl_application_status_history
                (application_id, remarks, history_date, initiator)
                VALUES
                (@application_id, '${remarkMsg}', CURRENT_TIMESTAMP, '${initiator}')
            `;
    const request = new sql.Request(transaction);
    request.input("application_id", sql.Int, application_id);
    await request.query(query);
  } catch (error) {
    throw error;
  }
}

import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST METHOD: Add Loan Application
router.post(
  "/addLoanData",
  upload.fields([
    { name: "csc" },
    { name: "emergency" },
    { name: "idComaker" },
    { name: "idApplicant" },
    { name: "authorityToDeduct" },
    { name: "payslipApplicant" },
    { name: "payslipComaker" },
  ]),
  async (req: Request, res: Response): Promise<any> => {
    // const { loanDetailsJSON, borrowerInfoJSON, comakerInfoJSON} = req.body;
    const { loanDetails, borrowerInfo, comakerInfo, applicantId } = req.body;
    // const applicant_id = Number(applicantId);

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // console.log(applicant_id);
        // console.log(loanDetails)
        const loanDetailsParse = JSON.parse(loanDetails[0]);
        const borrowerInfoParse = JSON.parse(borrowerInfo[0]);
        const comakerInfoParse = JSON.parse(comakerInfo[0]);
        const applicant_id = JSON.parse(applicantId[0]);

        // console.log(applicant_id);
        // console.log(req.body)

        // tbl_Loan_Application
        const request1 = new sql.Request(transaction);
        request1.input("applicant_id", sql.Int, applicant_id);
        request1.input("amount", sql.Float, loanDetailsParse.loanAmount);
        request1.input("loan_type", sql.VarChar, loanDetailsParse.loanType);
        const sql1 = `
                INSERT INTO [tbl_Loan_Application] 
                        ([applicant_id], [amount], [loan_type])
                    VALUES 
                        (@applicant_id, @amount, @loan_type);
                SELECT SCOPE_IDENTITY() AS application_id;
            `;
        const result1 = await request1.query(sql1);
        const application_id = result1.recordset[0].application_id;

        // tbl_Loan_Details
        const request2 = new sql.Request(transaction);
        request2.input("loan_amount", sql.Float, loanDetailsParse.loanAmount);
        request2.input("type_of_loan", sql.VarChar, loanDetailsParse.loanType);
        request2.input("term", sql.Int, loanDetailsParse.term);
        request2.input(
          "loan_application_number",
          sql.Int,
          loanDetailsParse.loanNumber
        );
        request2.input("purpose", sql.VarChar, loanDetailsParse.purpose);
        request2.input("borrowers_agreement", sql.VarChar, "Agreed");
        request2.input("co_makers_agreement", sql.VarChar, "Agreed");
        request2.input("applicant_id", sql.Int, applicant_id);
        request2.input("application_id", sql.Int, application_id);
        const sql2 = `
                INSERT INTO [tbl_Loan_Details] 
                ([loan_amount], [type_of_loan], [term], [loan_application_number], 
                [purpose], [borrowers_agreement], [co_makers_agreement], [applicant_id], [application_id])
                VALUES 
                (@loan_amount, @type_of_loan, @term, @loan_application_number, 
                @purpose, @borrowers_agreement, @co_makers_agreement, @applicant_id, @application_id)
            `;
        await request2.query(sql2);

        // tbl_Co_Makers_Information
        const request3 = new sql.Request(transaction);
        request3.input("co_last_name", sql.VarChar, comakerInfoParse.lastName);
        request3.input(
          "co_first_name",
          sql.VarChar,
          comakerInfoParse.firstname
        );
        request3.input(
          "co_middle_initial",
          sql.VarChar,
          comakerInfoParse.middleName
        );
        request3.input("co_region", sql.VarChar, comakerInfoParse.region);
        request3.input("co_province", sql.VarChar, comakerInfoParse.province);
        request3.input("co_city", sql.VarChar, comakerInfoParse.city);
        request3.input("co_barangay", sql.VarChar, comakerInfoParse.barangay);
        request3.input("co_street", sql.VarChar, comakerInfoParse.street);
        request3.input("co_zipcode", sql.VarChar, comakerInfoParse.zipcode);
        request3.input(
          "co_employee_number",
          sql.Int,
          comakerInfoParse.employeeNo
        );
        request3.input(
          "co_employment_status",
          sql.VarChar,
          comakerInfoParse.employeeStatus
        );
        request3.input("co_date_of_birth", sql.Date, comakerInfoParse.birth);
        request3.input("co_age", sql.Int, comakerInfoParse.age);
        request3.input("co_office", sql.VarChar, comakerInfoParse.office);
        request3.input(
          "co_monthly_salary",
          sql.Decimal,
          comakerInfoParse.salary
        );
        request3.input(
          "co_office_tel_number",
          sql.Int,
          comakerInfoParse.officeTelNo
        );
        request3.input(
          "co_years_in_service",
          sql.Int,
          comakerInfoParse.yearService
        );
        request3.input("co_mobile_number", sql.Int, comakerInfoParse.mobileNo);
        request3.input("applicant_id", sql.Int, applicant_id);
        request3.input("application_id", sql.Int, application_id);
        const sql3 = `
                INSERT INTO [tbl_Co_Makers_Information] 
                ([co_last_name], [co_first_name], [co_middle_initial], [co_region], [co_province], 
                 [co_city], [co_barangay], [co_street], [co_zipcode], [co_employee_number], 
                 [co_employment_status], [co_date_of_birth], [co_age], [co_office], [co_monthly_salary], 
                 [co_office_tel_number], [co_years_in_service], [co_mobile_number], [applicant_id], [application_id])
                VALUES 
                (@co_last_name, @co_first_name, @co_middle_initial, @co_region, @co_province, 
                 @co_city, @co_barangay, @co_street, @co_zipcode, @co_employee_number, 
                 @co_employment_status, @co_date_of_birth, @co_age, @co_office, @co_monthly_salary, 
                 @co_office_tel_number, @co_years_in_service, @co_mobile_number, @applicant_id, @application_id)
            `;
        await request3.query(sql3);

        // tbl_Borrowers_Information
        const request4 = new sql.Request(transaction);
        request4.input("last_name", sql.VarChar, borrowerInfoParse.lastName);
        request4.input("first_name", sql.VarChar, borrowerInfoParse.firstname);
        request4.input(
          "middle_initial",
          sql.VarChar,
          borrowerInfoParse.middleName
        );
        request4.input("region", sql.VarChar, borrowerInfoParse.region);
        request4.input("province", sql.VarChar, borrowerInfoParse.province);
        request4.input("city", sql.VarChar, borrowerInfoParse.city);
        request4.input("barangay", sql.VarChar, borrowerInfoParse.barangay);
        request4.input("street", sql.VarChar, borrowerInfoParse.street);
        request4.input("zipcode", sql.VarChar, borrowerInfoParse.zipcode);
        request4.input(
          "employee_number",
          sql.Int,
          borrowerInfoParse.employeeNo
        );
        request4.input(
          "employment_status",
          sql.VarChar,
          borrowerInfoParse.employeeStatus
        );
        request4.input("date_of_birth", sql.Date, borrowerInfoParse.birth);
        request4.input("age", sql.Int, borrowerInfoParse.age);
        request4.input("office", sql.VarChar, borrowerInfoParse.office);
        request4.input("monthly_salary", sql.Decimal, borrowerInfoParse.salary);
        request4.input(
          "office_tel_number",
          sql.Int,
          borrowerInfoParse.officeTelNo
        );
        request4.input(
          "years_in_service",
          sql.Int,
          borrowerInfoParse.yearService
        );
        request4.input("mobile_number", sql.Int, borrowerInfoParse.mobileNo);
        request4.input("applicant_id", sql.Int, applicant_id);
        request4.input("application_id", sql.Int, application_id);
        const sql4 = `
                INSERT INTO [tbl_Borrowers_Information] 
                        ([last_name], [first_name], [middle_initial], [region], [province], 
                         [city], [barangay], [street], [zipcode], [employee_number], 
                         [employment_status], [date_of_birth], [age], [office], [monthly_salary], 
                         [office_tel_number], [years_in_service], [mobile_number], [applicant_id], [application_id])
                    VALUES 
                        (@last_name, @first_name, @middle_initial, @region, @province, 
                         @city, @barangay, @street, @zipcode, @employee_number, 
                         @employment_status, @date_of_birth, @age, @office, @monthly_salary, 
                         @office_tel_number, @years_in_service, @mobile_number, @applicant_id, @application_id)
            `;
        await request4.query(sql4);

        // Save Files
        await fileServiceSaveFile(application_id, applicant_id, req.files);

        // tbl_Documents
        const request5 = new sql.Request(transaction);
        request5.input("cscAppointment_path", sql.VarChar, getFilePath("csc"));
        request5.input("emergency_path", sql.VarChar, getFilePath("emergency"));
        request5.input("idComaker_path", sql.VarChar, getFilePath("idComaker"));
        request5.input(
          "idApplicant_path",
          sql.VarChar,
          getFilePath("idApplicant")
        );
        request5.input(
          "authorityToDeduct_path",
          sql.VarChar,
          getFilePath("authorityToDeduct")
        );
        request5.input(
          "payslipApplicant_path",
          sql.VarChar,
          getFilePath("payslipApplicant")
        );
        request5.input(
          "payslipComaker_path",
          sql.VarChar,
          getFilePath("payslipComaker")
        );
        request5.input("application_id", sql.Int, application_id);
        const sql5 = `
            INSERT INTO [tbl_Documents]
                ([cscAppointment_path],
                [emergency_path],
                [idComaker_path],
                [idApplicant_path],
                [authorityToDeduct_path],
                [payslipApplicant_path],
                [payslipComaker_path],
                [application_id])
            VALUES
                (@cscAppointment_path,
                @emergency_path,
                @idComaker_path,
                @idApplicant_path,
                @authorityToDeduct_path,
                @payslipApplicant_path,
                @payslipComaker_path,
                @application_id)
            `;
        await request5.query(sql5);

        // tbl_Signature
        const request6 = new sql.Request(transaction);
        request6.input("application_id", sql.Int, application_id);
        const sql6 = `
            INSERT INTO [tbl_Signature]
                ([application_id])
            VALUES
                (@application_id)
            `;
        await request6.query(sql6);

        // tbl_Approval
        const request7 = new sql.Request(transaction);
        request7.input("application_id", sql.Int, application_id);
        const sql7 = `
            INSERT INTO [tbl_Approval]
                ([application_id])
            VALUES
                (@application_id)
            `;
        await request7.query(sql7);

        // tbl_department_status
        const sql8 = `
            INSERT INTO tbl_department_status
            (application_id, department_id, status)
            VALUES
            (${application_id}, 1, 'Pending'),
            (${application_id}, 2, 'Pending'),
            (${application_id}, 3, 'Pending'),
            (${application_id}, 4, 'Pending'),
            (${application_id}, 5, 'Pending'),
            (${application_id}, 6, 'Pending'),
            (${application_id}, 7, 'Pending'),
            (${application_id}, 8, 'Pending'),
            (${application_id}, 9, 'Pending')
            `;
        await new sql.Request(transaction).query(sql8);

        // Update Loan Status History
        await updateLoanStatusHistory("Applicant", application_id, transaction);

        await transaction.commit();
        return res
          .status(201)
          .json({ success: true, message: "All data added successfully." });
      } catch (err: any) {
        await transaction.rollback();
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
      }
    } catch (error: any) {
      console.error("Transaction error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
);

// PATCH METHOD: Update Approval OSDS
router.patch(
  "/loanApplication/updateApprovalOSDS",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { application_id } = req.body;
      const office = "OSDS";

      if (!application_id) {
        return res
          .status(400)
          .json({ success: false, message: "Application ID is required" });
      }

      const pool = await connectToDatabase();

      // Begin transaction
      const transaction = pool.transaction();
      await transaction.begin();

      // Update loan status
      const updateStatusResult = await transaction
        .request()
        .input("status", sql.VarChar, "Approved")
        .input("office", sql.VarChar, office)
        .input("application_id", sql.Int, application_id).query(`
                UPDATE tbl_department_status
                SET status = @status,
                    updated_at = CURRENT_TIMESTAMP 
                FROM tbl_department_status AS tas
                INNER JOIN tbl_department AS toff
                ON tas.department_id = toff.department_id
                WHERE toff.department_name = @office AND tas.application_id = @application_id;
            `);

      if (updateStatusResult.rowsAffected[0] === 0) {
        await transaction.rollback();
        return res
          .status(404)
          .json({ success: false, message: "No matching record found" });
      }

      // Insert into loan status history
      let remarkMsg = "";
      switch (office.toLowerCase()) {
        case "applicant":
          remarkMsg = "Submitted to OSDS";
          break;
        case "osds":
          remarkMsg = "Forwarded to Accounting";
          break;
        case "accounting":
          remarkMsg = "For Assessment";
          break;
        case "secretariat":
        case "hr":
        case "admin":
          remarkMsg = "For Signature";
          break;
        case "legal":
        case "asds":
          remarkMsg = "For Endorsement";
          break;
        case "sds":
          remarkMsg = "For Payment Process";
          break;
        case "payment":
          remarkMsg = "Payment Confirm";
          break;
        default:
          remarkMsg = "Status Updated";
          break;
      }

      const insertHistoryResult = await transaction
        .request()
        .input("application_id", sql.Int, application_id)
        .input("remarks", sql.VarChar, remarkMsg)
        .input("initiator", sql.VarChar, office).query(`
                INSERT INTO tbl_application_status_history (application_id, remarks, history_date, initiator)
                VALUES (@application_id, @remarks, CURRENT_TIMESTAMP, @initiator);
            `);

      if (insertHistoryResult.rowsAffected[0] === 0) {
        await transaction.rollback();
        return res
          .status(500)
          .json({ success: false, message: "Failed to insert status history" });
      }

      // Commit transaction
      await transaction.commit();

      res
        .status(200)
        .json({ success: true, message: "Loan status updated successfully!" });
    } catch (error) {
      console.error("Failed to update loan status:", error);
      res
        .status(500)
        .json({ message: "Failed to update approval OSDS", error });
    }
  }
);

export default router;
