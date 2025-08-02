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
      const departmentId = parseInt(req.params.departmentId);

      const pool = await connectToDatabase();
      // const result = await pool.request().query(`
      //       SELECT
      //           ld.loan_details_id,
      //           ld.loan_amount,
      //           ld.type_of_loan,
      //           ld.term,
      //           ld.loan_application_number,
      //           ld.purpose,
      //           ld.borrowers_agreement,
      //           ld.co_makers_agreement,
      //           ld.applicant_id,
      //           ld.application_id,
      //           ld.date_submitted,
      //           a.last_name,
      //           a.first_name,
      //           a.middle_name,
      //           la.is_approved_osds
      //       FROM tbl_Loan_Application la
      //       JOIN tbl_Loan_Details ld
      //           ON la.application_id = ld.application_id
      //       JOIN tbl_Applicant a
      //           ON la.applicant_id = a.applicant_id
      //       WHERE la.is_filled_out = 'Yes';
      //   `);
      console.log(departmentId);

      const result = await pool.request().input("departmentId", departmentId)
        .query(`
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
                la.department_id,
                la.status
                    FROM tbl_Department_Status la
                    JOIN tbl_Loan_Details ld
                        ON la.application_id = ld.application_id
                    JOIN tbl_Applicant a
                        ON ld.applicant_id = a.applicant_id
                    WHERE la.department_id = 8 AND la.application_id IN (
                    SELECT application_id
                    FROM tbl_Department_Status
                    WHERE department_id IN (6, 7) AND status = 'Approved');
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

// GET METHOD: Fetch loanDetails for Signature
router.get(
  "/loanApplication/getSignatureDetails",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const pool = await connectToDatabase();
      const result = await pool.request().query(`
            SELECT * 
            FROM [tbl_Signature]; 
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

// GET METHOD: Fetch loanDetails for Signature by Application Id
router.get(
  "/loanApplication/getSignatureDetailsApplicationId/:application_id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const applicationId = parseInt(req.params.application_id);

      const pool = await connectToDatabase();
      const result = await pool.request().input("application_id", applicationId)
        .query(`
          SELECT s.*,
            sa.first_name AS accounting_first_name,
            sa.middle_name AS accounting_middle_name,
            sa.last_name AS accounting_last_name,
            sa.ext_name AS accounting_ext_name,
            sa.designation AS accounting_designation,
            sh.first_name AS hr_first_name,
            sh.middle_name AS hr_middle_name,
            sh.last_name AS hr_last_name,
            sh.ext_name AS hr_ext_name,
            sh.designation AS hr_designation,
            sad.first_name AS admin_first_name,
            sad.middle_name AS admin_middle_name,
            sad.last_name AS admin_last_name,
            sad.ext_name AS admin_ext_name,
            sad.designation AS admin_designation,
            sl.first_name AS legal_first_name,
            sl.middle_name AS legal_middle_name,
            sl.last_name AS legal_last_name,
            sl.ext_name AS legal_ext_name,
            sl.designation AS legal_designation,
            sasds.first_name AS asds_first_name,
            sasds.middle_name AS asds_middle_name,
            sasds.last_name AS asds_last_name,
            sasds.ext_name AS asds_ext_name,
            sasds.designation AS asds_designation,
            ssds.first_name AS sds_first_name,
            ssds.middle_name AS sds_middle_name,
            ssds.last_name AS sds_last_name,
            ssds.ext_name AS sds_ext_name,
            ssds.designation AS sds_designation
          FROM [tbl_Signature] s
          LEFT JOIN [tbl_Staff] sa ON s.staff_id_accounting = sa.staff_id
          LEFT JOIN [tbl_Staff] sh ON s.staff_id_hr = sh.staff_id
          LEFT JOIN [tbl_Staff] sad ON s.staff_id_admin = sad.staff_id
          LEFT JOIN [tbl_Staff] sl ON s.staff_id_legal = sl.staff_id
          LEFT JOIN [tbl_Staff] sasds ON s.staff_id_asds = sasds.staff_id
          LEFT JOIN [tbl_Staff] ssds ON s.staff_id_sds = ssds.staff_id
          WHERE s.application_id = @application_id;
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

// GET METHOD: Fetch loanDetails for Signature by Id FOR SIGNATURE PAGE
router.get(
  "/loanApplication/getLoanDetailsSignature/:departmentId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const departmentId = parseInt(req.params.departmentId);

      // if (departmentId !== 4) {
      //   return res.status(400).json({ message: "Invalid DepartmentId" });
      // }

      const pool = await connectToDatabase();
      const result = await pool.request().input("departmentId", departmentId)
        .query(`
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
                la.department_id,
                la.status
                    FROM tbl_Department_Status la
                    JOIN tbl_Loan_Details ld
                        ON la.application_id = ld.application_id
                    JOIN tbl_Applicant a
                        ON ld.applicant_id = a.applicant_id
                    JOIN tbl_Loan_Application lap
                        ON la.application_id = lap.application_id
                    WHERE la.department_id = @departmentId AND la.application_id IN (
                    SELECT application_id
                    FROM tbl_Department_Status
                    WHERE lap.is_filled_out IS NOT NULL)
        `);

      if (result.recordset.length > 0) {
        res.status(200).json(result.recordset);
      } else {
        res.status(404).json({
          message: "No loan details found for the given applicationId",
        });
      }
    } catch (error) {
      console.error("Error fetching loan details:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  }
);

// GET METHOD: Fetch loanDetails for Signature by Id FOR APPROVAL PAGE
router.get(
  "/loanApplication/getLoanDetailsApproval/:departmentId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const departmentId = parseInt(req.params.departmentId);

      // if (departmentId !== 4) {
      //   return res.status(400).json({ message: "Invalid DepartmentId" });
      // }

      const pool = await connectToDatabase();
      const result = await pool.request().input("departmentId", departmentId)
        .query(`
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
                la.department_id,
                la.status
                    FROM tbl_Department_Status la
                    JOIN tbl_Loan_Details ld
                        ON la.application_id = ld.application_id
                    JOIN tbl_Applicant a
                        ON ld.applicant_id = a.applicant_id
                    WHERE la.department_id = @departmentId AND la.application_id IN (
                    SELECT application_id
                    FROM tbl_Department_Status
                    WHERE department_id = 5 AND status = 'Approved');
        `);

      if (result.recordset.length > 0) {
        res.status(200).json(result.recordset);
      } else {
        res.status(404).json({
          message: "No loan details found for the given applicationId",
        });
      }
    } catch (error) {
      console.error("Error fetching loan details:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  }
);

// GET METHOD: Fetch Approval Details
router.get(
  "/loanApplication/getApprovalDetails",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const pool = await connectToDatabase();
      const result = await pool.request().query(`
        SELECT * FROM [tbl_Signature]; 
        `);

      if (result.recordset.length > 0) {
        res.status(200).json(result.recordset);
      } else {
        res.status(404).json({
          message: "No approval details found for the given applicationId",
        });
      }
    } catch (error) {
      console.error("Error fetching approval details:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  }
);

// GET METHOD: Fetch loanDetails for Accounting and OSDS By ID
router.get(
  "/loanApplication/getLoanDetailsById/:applicationId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const applicationId = parseInt(req.params.applicationId);

      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid applicationId" });
      }

      const pool = await connectToDatabase();
      const result = await pool.request().input("applicationId", applicationId)
        .query(`
          SELECT 
            ld.loan_details_id,
            ld.loan_amount,
            ld.type_of_loan,
            ld.term,
            ld.loan_application_number,
            ld.purpose,
            ld.other_purpose,
            ld.borrowers_agreement,
            ld.co_makers_agreement,
            ld.applicant_id,
            ld.application_id,
            ld.date_submitted,
            a.last_name,
            a.first_name,
            a.middle_name,
            a.designation,
            la.is_approved_osds
          FROM tbl_Loan_Application la
          JOIN tbl_Loan_Details ld ON la.application_id = ld.application_id
          JOIN tbl_Applicant a ON la.applicant_id = a.applicant_id
          WHERE ld.application_id = @applicationId;
        `);

      if (result.recordset.length > 0) {
        res.status(200).json(result.recordset[0]);
      } else {
        res.status(404).json({
          message: "No loan details found for the given applicationId",
        });
      }
    } catch (error) {
      console.error("Error fetching loan details:", error);
      res.status(500).json({ message: "Internal server error", error });
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
                JOIN tbl_Applicant APP ON LA.applicant_id = APP.applicant_id
                JOIN tbl_Department_Status ApS ON LA.application_id = ApS.application_id
                JOIN tbl_Department O ON ApS.department_id = O.department_id
                JOIN tbl_Loan_Details LD ON LA.application_ID = LD.application_id 
                WHERE ApS.status IN ('Pending', 'Rejected')
                  AND LA.is_filled_out = 'Yes'
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
                JOIN tbl_Department_Status ApS
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

// GET METHOD: Fetch all pending applications by applicantId
router.get(
  "/loanApplication/allPendingApplications/:applicantId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { applicantId } = req.params;

      // console.log("applicant id: ", applicantId);

      const pool = await connectToDatabase();

      const loanQuery = `
            SELECT * 
            FROM tbl_Loan_Application 
            WHERE applicant_id = @applicant_id
            ORDER BY application_date DESC;
        `;

      const loanResult = await pool
        .request()
        .input("applicant_id", applicantId)
        .query(loanQuery);

      if (!loanResult.recordset.length) {
        return res.status(200).json({
          success: false,
          message: [],
        });
      }

      const applications = await Promise.all(
        loanResult.recordset.map(async (loan) => {
          const historyQuery = `
              SELECT TOP 1 * 
              FROM tbl_Application_Status_History
              WHERE application_id = @application_id
              ORDER BY history_date DESC;
          `;

          const historyResult = await pool
            .request()
            .input("application_id", loan.application_id)
            .query(historyQuery);

          return {
            currentLoan: loan,
            currentHistory:
              historyResult.recordset.length > 0
                ? historyResult.recordset[0]
                : null,
          };
        })
      );

      return res.status(200).json({
        success: true,
        message: applications,
      });
    } catch (error) {
      console.error("Error fetching all pending applications:", error);
      res.status(500).json({
        message: "Failed to retrieve pending applications: ",
        error,
      });
    }
  }
);

// GET METHOD: Fetch all pending applications for co-maker by applicantId
router.get(
  "/loanApplication/allPendingCoMakerApplication/:email",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { email } = req.params;

      // console.log("email: ", email);

      const pool = await connectToDatabase();

      const loanQuery = `
            SELECT * 
            FROM tbl_Co_Makers_Information 
            WHERE co_email = @co_email
            ORDER BY application_id DESC;
        `;

      const loanResult = await pool
        .request()
        .input("co_email", sql.VarChar, email)
        .query(loanQuery);

      if (!loanResult.recordset.length) {
        return res.status(200).json({
          success: false,
          message: [],
        });
      }

      const applications = await Promise.all(
        loanResult.recordset.map(async (loan) => {
          const loanApplicationQuery = `
          SELECT 
            application_id, 
            applicant_id, 
            application_date, 
            amount, 
            loan_type, 
            is_approved_osds, 
            is_approved_accounting, 
            is_qualified, 
            is_filled_out,
            status,
            remarks_message
          FROM tbl_Loan_Application
          WHERE application_id = @application_id;
          `;

          const loanApplicationResult = await pool
            .request()
            .input("application_id", loan.application_id)
            .query(loanApplicationQuery);

          const historyQuery = `
              SELECT TOP 1 * 
              FROM tbl_Application_Status_History
              WHERE application_id = @application_id
              ORDER BY history_date DESC;
          `;

          const historyResult = await pool
            .request()
            .input("application_id", loan.application_id)
            .query(historyQuery);

          return {
            currentLoan: loanApplicationResult.recordset[0],
            currentHistory:
              historyResult.recordset.length > 0
                ? historyResult.recordset[0]
                : null,
          };
        })
      );

      return res.status(200).json({
        success: true,
        message: applications,
      });
    } catch (error) {
      console.error("Error fetching all pending applications:", error);
      res.status(500).json({
        message: "Failed to retrieve pending applications: ",
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
                    JOIN tbl_Department_Status OS
                    ON LA.application_id = OS.application_id
                    WHERE LA.status = 'Pending' AND LA.applicant_id = @applicant_id;
            `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Failed to get loan application status:", error);
      res.status(500).json({
        message: "Failed to retrieve loan application status: ",
        error,
      });
    }
  }
);

// GET METHOD: Fetch borrowers information by application_id
router.get(
  "/loanApplication/getBorrowersInformation/:application_id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { application_id } = req.params;

      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("application_id", sql.Int, application_id).query(`
                    SELECT * FROM tbl_Borrowers_Information 
                    WHERE application_id = @application_id
            `);

      res.status(200).json(result.recordset[0]);
    } catch (error) {
      console.error("Failed to get borrowers information:", error);
      res.status(500).json({
        message: "Failed to retrieve borrowers information: ",
        error,
      });
    }
  }
);

// GET METHOD: Fetch co-makers information by application_id
router.get(
  "/loanApplication/getCoMakersInformation/:application_id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { application_id } = req.params;

      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("application_id", sql.Int, application_id).query(`
                    SELECT * FROM tbl_Co_Makers_Information
                    WHERE application_id = @application_id
            `);

      res.status(200).json(result.recordset[0]);
    } catch (error) {
      console.error("Failed to get co-maker information:", error);
      res.status(500).json({
        message: "Failed to retrieve co-maker information: ",
        error,
      });
    }
  }
);

// GET METHOD: Fetch co-maker loanApplicationStatus by application id for CoMaker
router.get(
  "/loanApplication/LoanApplicationStatusCoMaker/:email",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { email } = req.params;

      const pool = await connectToDatabase();

      const loanQuery = `
            SELECT * 
            FROM tbl_Co_Makers_Information 
            WHERE co_email = @co_email
            ORDER BY application_id DESC;
        `;

      const loanResult = await pool
        .request()
        .input("co_email", sql.VarChar, email)
        .query(loanQuery);

      if (!loanResult.recordset.length) {
        return res.status(200).json({
          success: false,
          message: [],
        });
      }

      const applications = await Promise.all(
        loanResult.recordset.map(async (loan) => {
          const historyQuery = `
                SELECT * FROM tbl_Loan_Application LA
                    JOIN tbl_Department_Status OS
                    ON LA.application_id = OS.application_id
                    WHERE LA.status = 'Pending' AND LA.application_id = @application_id;
          `;

          const historyResult = await pool
            .request()
            .input("application_id", loan.application_id)
            .query(historyQuery);

          // res.status(200).json(historyResult.recordset);
          return historyResult.recordset.length > 0
            ? historyResult.recordset[0]
            : null;
        })
      );

      return res.status(200).json({
        applications,
      });
    } catch (error) {
      console.error("Failed to get loan application status:", error);
      res.status(500).json({
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
      res.status(500).json({
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
                    SELECT 
                    LA.application_id,
                    OS.status,
                    OS.updated_at,
                    O.department_name,
                    O.sequence_order
                    FROM tbl_Loan_Application LA
                    JOIN tbl_Department_Status OS
                    ON LA.application_id = OS.application_id
                    JOIN tbl_Department O
                    ON OS.department_id = O.department_id 
                    WHERE LA.applicant_id = @applicant_id
                    ORDER BY LA.applicant_id DESC;
                    `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Failed to get loan application history:", error);
      res.status(500).json({
        message: "Failed to retrieve loan application history: ",
        error,
      });
    }
  }
);

// GET METHOD: Fetch officeStatus by email for co-maker
router.get(
  "/loanApplication/officeStatusCoMaker/:email",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { email } = req.params;

      const pool = await connectToDatabase();

      const loanQuery = `
            SELECT * 
            FROM tbl_Co_Makers_Information 
            WHERE co_email = @co_email
            ORDER BY application_id DESC;
        `;

      const loanResult = await pool
        .request()
        .input("co_email", sql.VarChar, email)
        .query(loanQuery);

      if (!loanResult.recordset.length) {
        return res.status(200).json({
          success: false,
          message: [],
        });
      }

      const applications = await Promise.all(
        loanResult.recordset.map(async (loan) => {
          const historyQuery = `
            SELECT 
              LA.application_id,
              OS.status,
              OS.updated_at,
              O.department_name,
              O.sequence_order
            FROM tbl_Loan_Application LA
            JOIN tbl_Department_Status OS ON LA.application_id = OS.application_id
            JOIN tbl_Department O ON OS.department_id = O.department_id 
            WHERE LA.application_id = @application_id
            ORDER BY LA.applicant_id DESC;
          `;
          const historyResult = await pool
            .request()
            .input("application_id", loan.application_id)
            .query(historyQuery);

          return historyResult.recordset;
        })
      );

      return res.status(200).json(applications.flat());
    } catch (error) {
      console.error("Failed to get loan application history:", error);
      res.status(500).json({
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
                SELECT * FROM tbl_Department_Status
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

// GET METHOD: Fetch loanApplicationStatus by loanApplicationId
router.get(
  "/loanApplication/loanApplicationStatus/:applicantId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { applicantId } = req.params;

      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("applicant_id", sql.Int, applicantId).query(`
              SELECT * FROM tbl_Loan_Application LA
            JOIN tbl_Department_Status OS
            ON LA.application_id = OS.application_id
            WHERE LA.status = 'Pending' AND LA.applicant_id = @applicant_id;
            `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Failed to get loan application status:", error);
      res.status(500).json({
        message: "Failed to retrieve loan application status: ",
        error,
      });
    }
  }
);

// // GET METHOD: Fetch currentLoanApplication by loanApplicationId
// router.get(
//   "/loanApplication/currentLoanApplication/:applicantId",
//   async (req: Request, res: Response): Promise<any> => {
//     try {
//       const { applicantId } = req.params;

//       const pool = await connectToDatabase();

//       const loanResult = await pool.request()
//         .input("applicant_id", sql.Int, applicantId)
//         .query(`
//           SELECT TOP 1 *
//           FROM tbl_Loan_Application
//           WHERE status = 'Pending' AND applicant_id = @applicant_id
//           ORDER BY application_date DESC;
//         `);

//       const currentLoan = loanResult.recordset[0];

//       if (!currentLoan) {
//         return res.status(200).json({
//           success: true,
//           message: {
//             currentLoan: null,
//             currentHistory: null
//           }
//         });
//       }

//       const historyResult = await pool.request()
//         .input("application_id", sql.Int, currentLoan.application_id)
//         .query(`
//           SELECT TOP 1 *
//           FROM tbl_Application_Status_History
//           WHERE application_id = @application_id
//           ORDER BY history_date DESC;
//         `);

//       const currentHistory = historyResult.recordset[0] || null;

//       res.status(200).json({
//         success: true,
//         message: {
//           currentLoan,
//           currentHistory
//         }
//       });
//     } catch (error) {
//       console.error("Error fetching current loan application:", error);
//       res.status(500).json({
//         success: false,
//         message: "Server error while fetching loan application.",
//         error
//       });
//     }
//   }
// );

// GET METHOD: Fetch loanHistory by loanApplicationId
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
          FROM tbl_Loan_Application AS LA
          JOIN tbl_Loan_Details LD ON LA.application_id = LD.application_id
          WHERE LA.applicant_id = @applicant_id;
        `);

      res.status(200).json({
        success: true,
        message: result.recordset,
      });
    } catch (error) {
      console.error("Error fetching loan application history:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching loan application history.",
        error,
      });
    }
  }
);

// GET METHOD: Fetch loanHistory by loanApplicationId CO-MAKER
router.get(
  "/loanApplication/loanHistoryCoMaker/:email",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { email } = req.params;

      const pool = await connectToDatabase();

      const loanQuery = `
            SELECT * 
            FROM tbl_Co_Makers_Information 
            WHERE co_email = @co_email
            ORDER BY application_id DESC;
        `;

      const loanResult = await pool
        .request()
        .input("co_email", sql.VarChar, email)
        .query(loanQuery);

      if (!loanResult.recordset.length) {
        return res.status(200).json({
          success: false,
          message: [],
        });
      }

      const applications = await Promise.all(
        loanResult.recordset.map(async (loan) => {
          // console.log(loan.application_id);

          const historyQuery = `
          SELECT 
              LA.application_id, 
              LA.application_date, 
              LA.is_qualified, 
              LA.amount,
              LD.loan_application_number
            FROM tbl_Loan_Application AS LA
            JOIN tbl_Loan_Details LD ON LA.application_id = LD.application_id
            WHERE LA.application_id = @application_id;
          `;

          const historyResult = await pool
            .request()
            .input("application_id", loan.application_id)
            .query(historyQuery);

          // res.status(200).json(historyResult.recordset);
          return historyResult.recordset.length > 0
            ? historyResult.recordset[0]
            : null;
        })
      );

      return res.status(200).json({
        applications,
      });
    } catch (error) {
      console.error("Error fetching loan application history:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching loan application history.",
        error,
      });
    }
  }
);

// GET METHOD: Fetch officeStatus by loanApplicationId
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
          JOIN tbl_Department_Status OS ON LA.application_id = OS.application_id
          JOIN tbl_Department O ON OS.department_id = O.department_id
          WHERE LA.status = 'Pending' AND LA.applicant_id = @applicant_id
          ORDER BY LA.applicant_id DESC;
        `);

      res.status(200).json({
        success: true,
        message: result.recordset,
      });
    } catch (error) {
      console.error("Error fetching office status:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching office status.",
        error,
      });
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

// POST METHOD: Assess Loan Application
router.post(
  "/loanApplication/assessLoanApplication",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      const toYesNo = (val: any) =>
        val === true || val === "true" ? "Yes" : "No";

      const request = new sql.Request(transaction);
      await request
        .input(
          "signed_filled_laf",
          sql.VarChar(50),
          toYesNo(data.signedFilledLaf)
        )
        .input(
          "complete_supporting_documents",
          sql.VarChar(50),
          toYesNo(data.completeSupportingDocs)
        )
        .input(
          "authorized_signature_laf",
          sql.VarChar(50),
          toYesNo(data.authorizedSignatureLaf)
        )
        .input(
          "borrower_reaches_retirement",
          sql.VarChar(50),
          toYesNo(data.borrowerReachesRetirement)
        )
        .input("borrowers_age", sql.Int, data.borrowersAge)
        .input(
          "comakers_reaches_retirement",
          sql.VarChar(50),
          toYesNo(data.comakersReachesRetirement)
        )
        .input("comakers_age", sql.Int, data.comakersAge)
        .input(
          "borrowers_has_outstanding_balance",
          sql.VarChar(50),
          toYesNo(data.borrowersOutstandingPfLoan)
        )
        .input(
          "current_loan_balance",
          sql.Decimal(10, 2),
          data.currentLoanBalance
        )
        .input("past_due_loan", sql.Decimal(10, 2), data.pastDueLoan)
        .input("number_of_years_past_due", sql.Int, data.numberOfYearsPastDue)
        .input("number_of_months_past_due", sql.Int, data.numberOfMonthsPastDue)
        .input(
          "borrowers_take_home_pay",
          sql.VarChar(50),
          toYesNo(data.borrowersTakeHomePay)
        )
        .input("paid_30_percent", sql.VarChar(50), toYesNo(data.paid30Percent))
        .input(
          "percentage_of_principal_paid",
          sql.Int,
          data.percentageOfPrincipalPaid
        )
        .input(
          "principal_loan_amount",
          sql.Decimal(10, 2),
          data.principalLoanAmount
        )
        .input("principal", sql.Decimal(10, 2), data.principal)
        .input("interest", sql.Decimal(10, 2), data.interest)
        .input("net_proceeds", sql.Decimal(10, 2), data.netProceeds)
        .input(
          "net_take_home_pay_after_deduction",
          sql.Decimal(10, 2),
          data.netTakeHomePayAfterAmortization
        )
        .input(
          "monthly_amortization",
          sql.Decimal(10, 2),
          data.monthlyAmortization
        )
        .input("period_of_loan", sql.Int, data.periodOfLoan)
        // .input("processed_by", sql.VarChar(50), data.processedBy)
        // .input("reviewed_by", sql.VarChar(50), data.reviewedBy)
        .input("remarks", sql.VarChar(250), data.remarks ?? null)
        .input("application_id", sql.Int, data.application_id).query(`
        INSERT INTO tbl_Assessment_Form (
          signed_filled_laf, complete_supporting_documents, authorized_signature_laf,
          borrower_reaches_retirement, borrowers_age, comakers_reaches_retirement, comakers_age,
          borrowers_has_outstanding_balance, current_loan_balance, past_due_loan,
          number_of_years_past_due, number_of_months_past_due, borrowers_take_home_pay,
          paid_30_percent, percentage_of_principal_paid, principal_loan_amount,
          principal, interest, net_proceeds, net_take_home_pay_after_deduction,
          monthly_amortization, period_of_loan, remarks, application_id,
          computation_date_processed, eligibility_date_processed
        ) VALUES (
          @signed_filled_laf, @complete_supporting_documents, @authorized_signature_laf,
          @borrower_reaches_retirement, @borrowers_age, @comakers_reaches_retirement, @comakers_age,
          @borrowers_has_outstanding_balance, @current_loan_balance, @past_due_loan,
          @number_of_years_past_due, @number_of_months_past_due, @borrowers_take_home_pay,
          @paid_30_percent, @percentage_of_principal_paid, @principal_loan_amount,
          @principal, @interest, @net_proceeds, @net_take_home_pay_after_deduction,
          @monthly_amortization, @period_of_loan, @remarks, @application_id,
          GETDATE(), GETDATE()
        )
      `);

      // const request2 = new sql.Request(transaction);
      // await request2
      //   .input("status", sql.VarChar(50), "Approved")
      //   .input("application_id", sql.Int, data.application_id)
      //   .input("department_id", sql.Int, data.department_id).query(`
      //   UPDATE tbl_Department_Status
      //   SET status = @status, updated_at = CURRENT_TIMESTAMP
      //   WHERE application_id = @application_id AND department_id = @department_id
      // `);

      await transaction.commit();

      res.status(201).json({
        message: "Loan assessment added successfully",
        data,
        success: true,
      });
    } catch (error) {
      console.error("Failed to assess loan application:", error);
      res
        .status(500)
        .json({ message: "Failed to assess loan application", error });
    }
  }
);

// POST METHOD: Assess Loan Application FOR ADMIN
router.post(
  "/loanApplication/assessLoanApplicationAdmin",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      const toYesNo = (val: any) =>
        val === true || val === "true" ? "Yes" : "No";

      const request = new sql.Request(transaction);
      await request
        .input(
          "loan_application_form",
          sql.VarChar(50),
          toYesNo(data.loanApplicationForm)
        )
        .input(
          "authorization_to_deduct",
          sql.VarChar(50),
          toYesNo(data.authorizationToDeduct)
        )
        .input("latest_pay_slip", sql.VarChar(50), toYesNo(data.latestPaySlip))
        .input(
          "photocopy_deped_id",
          sql.VarChar(50),
          toYesNo(data.photocopyDepEdId)
        )
        .input(
          "approved_appointment",
          sql.VarChar(50),
          toYesNo(data.approvedAppointment)
        )
        .input(
          "proof_co_terminus",
          sql.VarChar(50),
          toYesNo(data.proofCoTerminus)
        )
        .input("others", sql.VarChar(250), data.othersSpecify ?? null)
        .input(
          "letter_of_request",
          sql.VarChar(50),
          toYesNo(data.letterOfRequest)
        )
        .input(
          "hospitalization",
          sql.VarChar(50),
          toYesNo(data.hospitalization)
        )
        .input(
          "medical_abstract",
          sql.VarChar(50),
          toYesNo(data.medicalAbstract)
        )
        .input("barangay", sql.VarChar(50), toYesNo(data.barangayCertificate))
        .input("application_id", sql.Int, data.application_id).query(`
        INSERT INTO tbl_Assessment_Form (
          loan_application_form, authorization_to_deduct, latest_pay_slip,
          photocopy_deped_id, approved_appointment, proof_co_terminus, others,
          letter_of_request, hospitalization, medical_abstract, barangay,
          application_id
        ) VALUES (
          @loan_application_form, @authorization_to_deduct, @latest_pay_slip,
          @photocopy_deped_id, @approved_appointment, @proof_co_terminus, @others,
          @letter_of_request, @hospitalization, @medical_abstract, @barangay,
         @application_id
        )
      `);

      // const request2 = new sql.Request(transaction);
      // await request2
      //   .input("status", sql.VarChar(50), "Approved")
      //   .input("application_id", sql.Int, data.application_id)
      //   .input("department_id", sql.Int, data.department_id).query(`
      //   UPDATE tbl_Department_Status
      //   SET status = @status, updated_at = CURRENT_TIMESTAMP
      //   WHERE application_id = @application_id AND department_id = @department_id
      // `);

      await transaction.commit();

      res.status(201).json({
        message: "Loan assessment added successfully",
        data,
        success: true,
      });
    } catch (error) {
      console.error("Failed to assess loan application:", error);
      res
        .status(500)
        .json({ message: "Failed to assess loan application", error });
    }
  }
);

// POST METHOD: Assess Personnel Part in Borrowers
router.post(
  "/loanApplication/assessPersonnelBorrowers",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      const request = new sql.Request(transaction);
      await request
        .input("employment_status_hr", sql.VarChar(50), data.employmentStatus)
        .input("net_pay", sql.Decimal(18, 2), data.netPay)
        .input("payroll_date", sql.DateTime, data.payrollMonth)
        .input("application_id", sql.Int, data.applicationId).query(`
          UPDATE tbl_Borrowers_Information
          SET
            employment_status_hr = @employment_status_hr,
            net_pay = @net_pay,
            payroll_date = @payroll_date
          WHERE application_id = @application_id
        `);

      await transaction.commit();

      res.status(201).json({
        message: "Personnel section added successfully",
        data,
        success: true,
      });
    } catch (error) {
      console.error("Failed to assess personnel section:", error);
      res
        .status(500)
        .json({ message: "Failed to assess personnel section", error });
    }
  }
);

// POST METHOD: Submit Accounting Signature
router.post(
  "/loanApplication/submitSignatureAccounting",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    // console.log(data);

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      const checkRequest = new sql.Request(transaction);
      const checkResult = await checkRequest
        .input("application_id", sql.Int, data.application_id)
        .query(
          `SELECT signature_id FROM tbl_Signature WHERE application_id = @application_id`
        );

      if (checkResult.recordset.length > 0) {
        // If exists, update
        const signatureId = checkResult.recordset[0].signature_id;

        const updateRequest = new sql.Request(transaction);
        await updateRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_accounting", sql.Int, data.staff_id)
          .input("signature_accounting", sql.NVarChar, data.signature)
          .input("signature_id", sql.Int, signatureId).query(`
            UPDATE tbl_Signature
            SET application_id = @application_id,
                staff_id_accounting = @staff_id_accounting,
                signature_accounting = @signature_accounting,
                accounting_date = GETDATE()
            WHERE signature_id = @signature_id
          `);
      } else {
        // No record, insert new
        const insertRequest = new sql.Request(transaction);
        await insertRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_accounting", sql.Int, data.staff_id)
          .input("signature_accounting", sql.NVarChar, data.signature).query(`
            INSERT INTO tbl_Signature (application_id, staff_id_accounting, signature_accounting)
            VALUES (@application_id, @staff_id_accounting, @signature_accounting)
          `);
      }

      // Update loan status
      // const statusRequest = new sql.Request(transaction);
      // await statusRequest
      //   .input("status", sql.VarChar(50), "Approved")
      //   .input("application_id", sql.Int, data.application_id)
      //   .input("department", sql.VarChar(50), "HR").query(`
      //     UPDATE tbl_Department_Status
      //     SET status = @status, updated_at = CURRENT_TIMESTAMP
      //     WHERE application_id = @application_id AND department = @department
      //   `);

      await transaction.commit();

      updateLoanStatus("Accounting", "Approved", data.application_id);

      res.status(200).json({
        message:
          checkResult.recordset.length > 0
            ? "Signature updated successfully."
            : "Signature added successfully.",
        success: true,
      });
    } catch (error) {
      console.error("submitSignatureAccounting error:", error);
      res
        .status(500)
        .json({ message: "Failed to submit Accounting signature", error });
    }
  }
);

// POST METHOD: Reject Admin Application
router.post(
  "/loanApplication/rejectAdmin",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    try {
      // Update department status
      await updateLoanStatus("Admin", "Rejected", data.application_id);
      await updateLoanStatus("HR", "Rejected", data.application_id);
      await updateLoanStatus("Legal", "Rejected", data.application_id);

      // Update main loan application status to 'Rejected'
      const pool = await connectToDatabase();
      await pool
        .request()
        .input("application_id", sql.Int, data.application_id)
        .input("status", sql.VarChar, "Rejected")
        .input("remarks_message", sql.NVarChar, data.remarks).query(`
          UPDATE tbl_Loan_Application
          SET status = @status,
          remarks_message = @remarks_message
          WHERE application_id = @application_id
        `);

      res.status(200).json({
        message: "Rejected Application successfully.",
        success: true,
      });
    } catch (error) {
      console.error("rejectAccounting error:", error);
      res.status(500).json({ message: "Failed to reject application", error });
    }
  }
);

// POST METHOD: Reject Accounting Application
router.post(
  "/loanApplication/rejectAccounting",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    try {
      // Update department status
      await updateLoanStatus("Accounting", "Rejected", data.application_id);

      // Update main loan application status to 'Rejected'
      const pool = await connectToDatabase();
      await pool
        .request()
        .input("application_id", sql.Int, data.application_id)
        .input("status", sql.VarChar, "Rejected")
        .input("remarks_message", sql.NVarChar, data.remarks).query(`
          UPDATE tbl_Loan_Application
          SET status = @status,
          remarks_message = @remarks_message
          WHERE application_id = @application_id
        `);

      res.status(200).json({
        message: "Rejected Application successfully.",
        success: true,
      });
    } catch (error) {
      console.error("rejectAccounting error:", error);
      res.status(500).json({ message: "Failed to reject application", error });
    }
  }
);

// POST METHOD: Submit HR Signature
router.post(
  "/loanApplication/submitSignatureHR",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    // console.log(data);

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      const checkRequest = new sql.Request(transaction);
      const checkResult = await checkRequest
        .input("application_id", sql.Int, data.application_id)
        .query(
          `SELECT signature_id FROM tbl_Signature WHERE application_id = @application_id`
        );

      if (checkResult.recordset.length > 0) {
        // If exists, update
        const signatureId = checkResult.recordset[0].signature_id;

        const updateRequest = new sql.Request(transaction);
        await updateRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_hr", sql.Int, data.staff_id)
          .input("signature_hr", sql.NVarChar, data.signature)
          .input("signature_id", sql.Int, signatureId).query(`
            UPDATE tbl_Signature
            SET application_id = @application_id,
                staff_id_hr = @staff_id_hr,
                signature_hr = @signature_hr,
                hr_date = GETDATE()
            WHERE signature_id = @signature_id
          `);
      } else {
        // No record, insert new
        const insertRequest = new sql.Request(transaction);
        await insertRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_hr", sql.Int, data.staff_id)
          .input("signature_hr", sql.NVarChar, data.signature).query(`
            INSERT INTO tbl_Signature (application_id, staff_id_hr, signature_hr)
            VALUES (@application_id, @staff_id_hr, @signature_hr)
          `);
      }

      // Update loan status
      // const statusRequest = new sql.Request(transaction);
      // await statusRequest
      //   .input("status", sql.VarChar(50), "Approved")
      //   .input("application_id", sql.Int, data.application_id)
      //   .input("department", sql.VarChar(50), "HR").query(`
      //     UPDATE tbl_Department_Status
      //     SET status = @status, updated_at = CURRENT_TIMESTAMP
      //     WHERE application_id = @application_id AND department = @department
      //   `);

      await transaction.commit();

      updateLoanStatus("HR", "Approved", data.application_id);

      res.status(200).json({
        message:
          checkResult.recordset.length > 0
            ? "Signature updated successfully."
            : "Signature added successfully.",
        success: true,
      });
    } catch (error) {
      console.error("submitSignatureHR error:", error);
      res.status(500).json({ message: "Failed to submit HR signature", error });
    }
  }
);

// POST METHOD: Submit ASDS Signature
router.post(
  "/loanApplication/submitSignatureASDS",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    // console.log(data);

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      const checkRequest = new sql.Request(transaction);
      const checkResult = await checkRequest
        .input("application_id", sql.Int, data.application_id)
        .query(
          `SELECT signature_id FROM tbl_Signature WHERE application_id = @application_id`
        );

      if (checkResult.recordset.length > 0) {
        // If exists, update
        const signatureId = checkResult.recordset[0].signature_id;

        const updateRequest = new sql.Request(transaction);
        await updateRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_asds", sql.Int, data.staff_id)
          .input("signature_asds", sql.NVarChar, data.signature)
          .input("signature_id", sql.Int, signatureId).query(`
            UPDATE tbl_Signature
            SET application_id = @application_id,
                staff_id_asds = @staff_id_asds,
                signature_asds = @signature_asds,
                asds_date = GETDATE()
            WHERE signature_id = @signature_id
          `);
      } else {
        // No record, insert new
        const insertRequest = new sql.Request(transaction);
        await insertRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_asds", sql.Int, data.staff_id)
          .input("signature_asds", sql.NVarChar, data.signature).query(`
            INSERT INTO tbl_Signature (application_id, staff_id_asds, signature_asds)
            VALUES (@application_id, @staff_id_asds, @signature_asds)
          `);
      }

      // Update loan status
      // const statusRequest = new sql.Request(transaction);
      // await statusRequest
      //   .input("status", sql.VarChar(50), "Approved")
      //   .input("application_id", sql.Int, data.application_id)
      //   .input("department", sql.VarChar(50), "HR").query(`
      //     UPDATE tbl_Department_Status
      //     SET status = @status, updated_at = CURRENT_TIMESTAMP
      //     WHERE application_id = @application_id AND department = @department
      //   `);

      await transaction.commit();

      updateLoanStatus("ASDS", "Approved", data.application_id);

      res.status(200).json({
        message:
          checkResult.recordset.length > 0
            ? "Signature updated successfully."
            : "Signature added successfully.",
        success: true,
      });
    } catch (error) {
      console.error("submitSignatureASDS error:", error);
      res
        .status(500)
        .json({ message: "Failed to submit ASDS signature", error });
    }
  }
);

// POST METHOD: Submit SDS Signature
router.post(
  "/loanApplication/submitSignatureSDS",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    // console.log(data);

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      const checkRequest = new sql.Request(transaction);
      const checkResult = await checkRequest
        .input("application_id", sql.Int, data.application_id)
        .query(
          `SELECT signature_id FROM tbl_Signature WHERE application_id = @application_id`
        );

      if (checkResult.recordset.length > 0) {
        // If exists, update
        const signatureId = checkResult.recordset[0].signature_id;

        const updateRequest = new sql.Request(transaction);
        await updateRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_sds", sql.Int, data.staff_id)
          .input("signature_sds", sql.NVarChar, data.signature)
          .input("signature_id", sql.Int, signatureId).query(`
            UPDATE tbl_Signature
            SET application_id = @application_id,
                staff_id_sds = @staff_id_sds,
                signature_sds = @signature_sds,
                sds_date = GETDATE()
            WHERE signature_id = @signature_id
          `);
      } else {
        // No record, insert new
        const insertRequest = new sql.Request(transaction);
        await insertRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_sds", sql.Int, data.staff_id)
          .input("signature_sds", sql.NVarChar, data.signature).query(`
            INSERT INTO tbl_Signature (application_id, staff_id_sds, signature_sds)
            VALUES (@application_id, @staff_id_sds, @signature_sds)
          `);
      }

      // Update loan status
      // const statusRequest = new sql.Request(transaction);
      // await statusRequest
      //   .input("status", sql.VarChar(50), "Approved")
      //   .input("application_id", sql.Int, data.application_id)
      //   .input("department", sql.VarChar(50), "HR").query(`
      //     UPDATE tbl_Department_Status
      //     SET status = @status, updated_at = CURRENT_TIMESTAMP
      //     WHERE application_id = @application_id AND department = @department
      //   `);

      await transaction.commit();

      updateLoanStatus("SDS", "Approved", data.application_id);

      res.status(200).json({
        message:
          checkResult.recordset.length > 0
            ? "Signature updated successfully."
            : "Signature added successfully.",
        success: true,
      });
    } catch (error) {
      console.error("submitSignatureSDS error:", error);
      res
        .status(500)
        .json({ message: "Failed to submit SDS signature", error });
    }
  }
);

// POST METHOD: Submit Admin Signature
router.post(
  "/loanApplication/submitSignatureAdmin",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    // console.log(data);

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      const checkRequest = new sql.Request(transaction);
      const checkResult = await checkRequest
        .input("application_id", sql.Int, data.application_id)
        .query(
          `SELECT signature_id FROM tbl_Signature WHERE application_id = @application_id`
        );

      if (checkResult.recordset.length > 0) {
        // If exists, update
        const signatureId = checkResult.recordset[0].signature_id;

        const updateRequest = new sql.Request(transaction);
        await updateRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_admin", sql.Int, data.staff_id)
          .input("signature_admin", sql.NVarChar, data.signature)
          .input("signature_id", sql.Int, signatureId).query(`
            UPDATE tbl_Signature
            SET application_id = @application_id,
                staff_id_admin = @staff_id_admin,
                signature_admin = @signature_admin,
                admin_date = GETDATE()
            WHERE signature_id = @signature_id
          `);
      } else {
        // No record, insert new
        const insertRequest = new sql.Request(transaction);
        await insertRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_admin", sql.Int, data.staff_id)
          .input("signature_admin", sql.NVarChar, data.signature).query(`
            INSERT INTO tbl_Signature (application_id, staff_id_admin, signature_admin)
            VALUES (@application_id, @staff_id_admin, @signature_admin)
          `);
      }

      // Update loan status
      // const statusRequest = new sql.Request(transaction);
      // await statusRequest
      //   .input("status", sql.VarChar(50), "Approved")
      //   .input("application_id", sql.Int, data.application_id)
      //   .input("department", sql.VarChar(50), "HR").query(`
      //     UPDATE tbl_Department_Status
      //     SET status = @status, updated_at = CURRENT_TIMESTAMP
      //     WHERE application_id = @application_id AND department = @department
      //   `);

      await transaction.commit();

      updateLoanStatus("Admin", "Approved", data.application_id);

      res.status(200).json({
        message:
          checkResult.recordset.length > 0
            ? "Signature updated successfully."
            : "Signature added successfully.",
        success: true,
      });
    } catch (error) {
      console.error("submitSignatureAdmin error:", error);
      res
        .status(500)
        .json({ message: "Failed to submit Admin signature", error });
    }
  }
);

// POST METHOD: Submit Legal Signature
router.post(
  "/loanApplication/submitSignatureLegal",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    // console.log(data);

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      const checkRequest = new sql.Request(transaction);
      const checkResult = await checkRequest
        .input("application_id", sql.Int, data.application_id)
        .query(
          `SELECT signature_id FROM tbl_Signature WHERE application_id = @application_id`
        );

      if (checkResult.recordset.length > 0) {
        // If exists, update
        const signatureId = checkResult.recordset[0].signature_id;

        const updateRequest = new sql.Request(transaction);
        await updateRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_legal", sql.Int, data.staff_id)
          .input("signature_legal", sql.NVarChar, data.signature)
          .input("signature_id", sql.Int, signatureId).query(`
            UPDATE tbl_Signature
            SET application_id = @application_id,
                staff_id_legal = @staff_id_legal,
                signature_legal = @signature_legal,
                legal_date = GETDATE()
            WHERE signature_id = @signature_id
          `);
      } else {
        // No record, insert new
        const insertRequest = new sql.Request(transaction);
        await insertRequest
          .input("application_id", sql.Int, data.application_id)
          .input("staff_id_legal", sql.Int, data.staff_id)
          .input("signature_legal", sql.NVarChar, data.signature).query(`
            INSERT INTO tbl_Signature (application_id, staff_id_legal, signature_legal)
            VALUES (@application_id, @staff_id_legal, @signature_legal)
          `);
      }

      await transaction.commit();

      updateLoanStatus("Legal", "Approved", data.application_id);

      res.status(200).json({
        message:
          checkResult.recordset.length > 0
            ? "Signature updated successfully."
            : "Signature added successfully.",
        success: true,
      });
    } catch (error) {
      console.error("submitSignatureAdmin error:", error);
      res
        .status(500)
        .json({ message: "Failed to submit Admin signature", error });
    }
  }
);

// POST METHOD: Submit Approval ASDS
router.post(
  "/loanApplication/submitApprovalASDS",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    // console.log(data);

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      const checkRequest = new sql.Request(transaction);
      const checkResult = await checkRequest
        .input("application_id", sql.Int, data.application_id)
        .query(
          `SELECT [approval_id] FROM [tbl_Approval] WHERE [application_id] = @application_id`
        );

      if (checkResult.recordset.length > 0) {
        // If exists, update
        const updateRequest = new sql.Request(transaction);
        await updateRequest
          .input("status_asds", sql.VarChar, data.approved)
          .input("staff_id_asds", sql.Int, data.staff_id)
          .input("approval_id", sql.Int, checkResult.recordset[0].approval_id)
          .query(`
            UPDATE [tbl_Approval] 
            SET [status_asds] = @status_asds,
                [staff_id_asds] = @staff_id_asds
            WHERE [approval_id] = @approval_id
          `);
      } else {
        // If not, rollback and return error response
        await transaction.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Can't find approval data." });
      }

      await transaction.commit();

      try {
        await updateLoanStatus("ASDS", "Approved", data.application_id);
      } catch (err) {
        console.error("Error in updateLoanStatus:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to update loan status." });
      }

      res.status(200).json({
        message: "Approval updated successfully.",
        success: true,
      });
    } catch (error) {
      console.error("submitApprovalASDS error:", error);
      res
        .status(500)
        .json({ message: "Failed to submit ASDS Approval", error });
    }
  }
);

// POST METHOD: Submit Approval SDS
router.post(
  "/loanApplication/submitApprovalSDS",
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body;

    // console.log(data);

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      // console.log(data.application_id);

      const checkRequest = new sql.Request(transaction);
      const checkResult = await checkRequest
        .input("application_id", sql.Int, data.application_id)
        .query(
          `SELECT [approval_id] FROM [tbl_Approval] WHERE [application_id] = @application_id`
        );

      if (checkResult.recordset.length > 0) {
        // console.log(checkResult.recordset);
        // If exists, update
        const updateRequest = new sql.Request(transaction);
        await updateRequest
          .input("status_sds", sql.VarChar, data.approved)
          .input("staff_id_sds", sql.Int, data.staff_id)
          .input("approval_id", sql.Int, checkResult.recordset[0].approval_id)
          .query(`
            UPDATE [tbl_Approval] 
            SET [status_sds] = @status_sds,
                [staff_id_sds] = @staff_id_sds
            WHERE [approval_id] = @approval_id
          `);
      } else {
        // Rollback and send error if approval not found
        await transaction.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Can't find approval data." });
      }

      await transaction.commit();

      // Safely await and handle updateLoanStatus
      try {
        await updateLoanStatus("SDS", "Approved", data.application_id);
      } catch (err) {
        console.error("Error in updateLoanStatus:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to update loan status." });
      }

      res.status(200).json({
        message: "Approval updated successfully.",
        success: true,
      });
    } catch (error) {
      console.error("submitApprovalSDS error:", error);
      res.status(500).json({ message: "Failed to submit SDS Approval", error });
    }
  }
);

// PATCH METHOD: Update Loan Status
export async function updateLoanStatus(
  office: string,
  status: string,
  application_id: string
): Promise<any> {
  try {
    const pool = await connectToDatabase();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const query = `
        UPDATE tbl_Department_Status
        SET status = @status,
            updated_at = CURRENT_TIMESTAMP 
        FROM tbl_Department_Status AS tas
        INNER JOIN tbl_department AS toff
        ON tas.department_id = toff.department_id
        WHERE toff.department_name = @office AND tas.application_id = @application_id;
      `;

    const request = new sql.Request(transaction);
    request.input("status", sql.VarChar, status);
    request.input("office", sql.VarChar, office);
    request.input("application_id", sql.Int, application_id);
    await request.query(query);

    const applicationId = parseInt(application_id);

    // Call the method using `this`
    await updateLoanStatusHistory(office, applicationId, transaction);

    await transaction.commit();

    return "Application status updated successfully!";
  } catch (error) {
    console.error("Error in updateLoanStatus:", error);
    throw new Error("Failed to update loan status");
  }
}

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

// POST METHOD: Reject application and add remarks_message
router.post(
  "/loanApplication/reject",
  async (req: Request, res: Response): Promise<any> => {
    const { applicationId, remarks } = req.body;

    try {
      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("application_id", sql.Int, applicationId)
        .input("remarks_message", sql.VarChar, remarks)
        .input("status", sql.VarChar, "Reject").query(`
        UPDATE [tbl_Loan_Application]
        SET [status] = @status,
            [remarks_message] = @remarks_message
        WHERE [application_id] = @application_id
      `);

      res.status(200).json({
        success: true,
        message: "Application rejected and remarks added.",
      });
    } catch (error) {
      console.error("Failed to reject application:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject application",
        error,
      });
    }
  }
);

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
                INSERT INTO tbl_Application_Status_History
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

// POST METHOD: Add Loan Application with the EMAIL OF CO-MAKER ONLY
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
    const { loanDetails, borrowerInfo, comakerInfo, applicantId, signature } =
      req.body;
    // const applicant_id = Number(applicantId);

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // console.log(applicant_id);
        // console.log(loanDetails)
        const loanDetailsParse = JSON.parse(loanDetails);
        const borrowerInfoParse = JSON.parse(borrowerInfo);
        const comakerInfoParse = JSON.parse(comakerInfo);
        const applicant_id = Number(applicantId);

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
        request2.input(
          "other_purpose",
          sql.NVarChar,
          loanDetailsParse.otherPurpose
        );
        const sql2 = `
                INSERT INTO [tbl_Loan_Details] 
                ([loan_amount], [type_of_loan], [term], [loan_application_number], 
                [purpose], [borrowers_agreement], [co_makers_agreement], [applicant_id], [application_id], [other_purpose])
                VALUES 
                (@loan_amount, @type_of_loan, @term, @loan_application_number, 
                @purpose, @borrowers_agreement, @co_makers_agreement, @applicant_id, @application_id, @other_purpose)
            `;
        await request2.query(sql2);

        // tbl_Co_Makers_Information
        // const request3 = new sql.Request(transaction);
        // request3.input("co_last_name", sql.VarChar, comakerInfoParse.lastName);
        // request3.input(
        //   "co_first_name",
        //   sql.VarChar,
        //   comakerInfoParse.firstname
        // );
        // request3.input(
        //   "co_middle_initial",
        //   sql.VarChar,
        //   comakerInfoParse.middleName
        // );
        // request3.input("co_region", sql.VarChar, comakerInfoParse.region);
        // request3.input("co_province", sql.VarChar, comakerInfoParse.province);
        // request3.input("co_city", sql.VarChar, comakerInfoParse.city);
        // request3.input("co_barangay", sql.VarChar, comakerInfoParse.barangay);
        // request3.input("co_street", sql.VarChar, comakerInfoParse.street);
        // request3.input("co_zipcode", sql.VarChar, comakerInfoParse.zipcode);
        // request3.input(
        //   "co_employee_number",
        //   sql.Int,
        //   comakerInfoParse.employeeNo
        // );
        // request3.input(
        //   "co_employment_status",
        //   sql.VarChar,
        //   comakerInfoParse.employeeStatus
        // );
        // request3.input("co_date_of_birth", sql.Date, comakerInfoParse.birth);
        // request3.input("co_age", sql.Int, comakerInfoParse.age);
        // request3.input("co_office", sql.VarChar, comakerInfoParse.office);
        // request3.input(
        //   "co_monthly_salary",
        //   sql.Decimal,
        //   comakerInfoParse.salary
        // );
        // request3.input(
        //   "co_office_tel_number",
        //   sql.VarChar,
        //   comakerInfoParse.officeTelNo
        // );
        // request3.input(
        //   "co_years_in_service",
        //   sql.Int,
        //   comakerInfoParse.yearService
        // );
        // request3.input("co_mobile_number", sql.VarChar, comakerInfoParse.mobileNo);
        // request3.input("applicant_id", sql.Int, applicant_id);
        // request3.input("application_id", sql.Int, application_id);
        // request3.input("position", sql.VarChar, comakerInfoParse.position);
        // const sql3 = `
        //         INSERT INTO [tbl_Co_Makers_Information]
        //         ([co_last_name], [co_first_name], [co_middle_initial], [co_region], [co_province],
        //          [co_city], [co_barangay], [co_street], [co_zipcode], [co_employee_number],
        //          [co_employment_status], [co_date_of_birth], [co_age], [co_office], [co_monthly_salary],
        //          [co_office_tel_number], [co_years_in_service], [co_mobile_number], [applicant_id], [application_id], [position])
        //         VALUES
        //         (@co_last_name, @co_first_name, @co_middle_initial, @co_region, @co_province,
        //          @co_city, @co_barangay, @co_street, @co_zipcode, @co_employee_number,
        //          @co_employment_status, @co_date_of_birth, @co_age, @co_office, @co_monthly_salary,
        //          @co_office_tel_number, @co_years_in_service, @co_mobile_number, @applicant_id, @application_id, @position)
        //     `;
        // await request3.query(sql3);

        const request3 = new sql.Request(transaction);
        request3.input("co_email", sql.VarChar, comakerInfoParse.email);
        request3.input("application_id", sql.Int, application_id);
        const sql3 = `
                INSERT INTO [tbl_Co_Makers_Information] 
                ([co_email], [application_id])
                VALUES 
                (@co_email, @application_id)
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
          sql.VarChar,
          borrowerInfoParse.officeTelNo
        );
        request4.input(
          "years_in_service",
          sql.Int,
          borrowerInfoParse.yearService
        );
        request4.input(
          "mobile_number",
          sql.VarChar,
          borrowerInfoParse.mobileNo
        );
        request4.input("applicant_id", sql.Int, applicant_id);
        request4.input("application_id", sql.Int, application_id);
        request4.input("position", sql.VarChar, borrowerInfoParse.position);
        request4.input("signature", sql.NVarChar, signature);
        const sql4 = `
                INSERT INTO [tbl_Borrowers_Information] 
                        ([last_name], [first_name], [middle_initial], [region], [province], 
                         [city], [barangay], [street], [zipcode], [employee_number], 
                         [employment_status], [date_of_birth], [age], [office], [monthly_salary], 
                         [office_tel_number], [years_in_service], [mobile_number], [applicant_id], [application_id], [position], [signature])
                    VALUES 
                        (@last_name, @first_name, @middle_initial, @region, @province, 
                         @city, @barangay, @street, @zipcode, @employee_number, 
                         @employment_status, @date_of_birth, @age, @office, @monthly_salary, 
                         @office_tel_number, @years_in_service, @mobile_number, @applicant_id, @application_id, @position, @signature)
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

        // tbl_Department_Status
        const sql8 = `
            INSERT INTO tbl_Department_Status
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

// POST METHOD: Add Loan Application FOR CO-MAKER
router.patch(
  "/addLoanDataCoMaker",
  async (req: Request, res: Response): Promise<any> => {
    // const { loanDetailsJSON, borrowerInfoJSON, comakerInfoJSON} = req.body;
    const { comakerInfo, applicantId, signature, applicationId } = req.body;

    try {
      // console.log(comakerInfo, applicantId, signature, applicationId);
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        const comakerInfoParse = JSON.parse(comakerInfo);
        const applicant_id = Number(applicantId);
        const application_id = Number(applicationId);

        // tbl_Co_Makers_Information
        const request = new sql.Request(transaction);
        request.input("co_last_name", sql.VarChar, comakerInfoParse.lastName);
        request.input("co_first_name", sql.VarChar, comakerInfoParse.firstname);
        request.input(
          "co_middle_initial",
          sql.VarChar,
          comakerInfoParse.middleName
        );
        request.input("co_region", sql.VarChar, comakerInfoParse.region);
        request.input("co_province", sql.VarChar, comakerInfoParse.province);
        request.input("co_city", sql.VarChar, comakerInfoParse.city);
        request.input("co_barangay", sql.VarChar, comakerInfoParse.barangay);
        request.input("co_street", sql.VarChar, comakerInfoParse.street);
        request.input("co_zipcode", sql.Int, comakerInfoParse.zipcode);
        request.input(
          "co_employee_number",
          sql.Int,
          comakerInfoParse.employeeNo
        );
        request.input(
          "co_employment_status",
          sql.VarChar,
          comakerInfoParse.employeeStatus
        );
        request.input("co_date_of_birth", sql.Date, comakerInfoParse.birth);
        request.input("co_age", sql.Int, comakerInfoParse.age);
        request.input("co_office", sql.VarChar, comakerInfoParse.office);
        request.input(
          "co_monthly_salary",
          sql.Decimal,
          comakerInfoParse.salary
        );
        request.input(
          "co_office_tel_number",
          sql.VarChar,
          comakerInfoParse.officeTelNo
        );
        request.input(
          "co_years_in_service",
          sql.Int,
          comakerInfoParse.yearService
        );
        request.input(
          "co_mobile_number",
          sql.VarChar,
          comakerInfoParse.mobileNo
        );
        request.input("position", sql.VarChar, comakerInfoParse.position);
        request.input("co_signature", sql.NVarChar, signature);
        request.input("application_id", sql.Int, application_id);
        request.input("applicant_id", sql.Int, applicant_id);

        const sqlUpdate = `
      UPDATE [tbl_Co_Makers_Information]
      SET
        [co_last_name] = @co_last_name,
        [co_first_name] = @co_first_name,
        [co_middle_initial] = @co_middle_initial,
        [co_region] = @co_region,
        [co_province] = @co_province,
        [co_city] = @co_city,
        [co_barangay] = @co_barangay,
        [co_street] = @co_street,
        [co_zipcode] = @co_zipcode,
        [co_employee_number] = @co_employee_number,
        [co_employment_status] = @co_employment_status,
        [co_date_of_birth] = @co_date_of_birth,
        [co_age] = @co_age,
        [co_office] = @co_office,
        [co_monthly_salary] = @co_monthly_salary,
        [co_office_tel_number] = @co_office_tel_number,
        [co_years_in_service] = @co_years_in_service,
        [co_mobile_number] = @co_mobile_number,
        [position] = @position,
        [co_signature] = @co_signature,
        [applicant_id] = @applicant_id,
        [co_date] = GETDATE()
      WHERE [application_id] = @application_id
    `;

        await request.query(sqlUpdate);

        const filledOutForm = new sql.Request(transaction);
        filledOutForm.input("application_id", sql.Int, application_id);
        filledOutForm.input("is_filled_out", sql.VarChar, "Yes");
        await filledOutForm.query(`
          UPDATE [tbl_Loan_Application]
          SET [is_filled_out] = @is_filled_out
          WHERE [application_id] = @application_id
        `);

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

// PATCH METHOD: Update department 9 status to 'Paid'
router.patch("/paid", async (req: Request, res: Response): Promise<any> => {
  const { application_id } = req.body;

  try {
    const pool = await connectToDatabase();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Update department 9 status to 'Paid'
    const updateRequest = new sql.Request(transaction);
    await updateRequest
      .input("application_id", sql.Int, application_id)
      .input("department_id", sql.Int, 9)
      .input("status", sql.VarChar(50), "Paid").query(`
          UPDATE tbl_Department_Status
          SET status = @status, updated_at = CURRENT_TIMESTAMP
          WHERE application_id = @application_id AND department_id = @department_id
        `);

    // Update loan application status to 'Paid'
    const updateLoanStatusRequest = new sql.Request(transaction);
    await updateLoanStatusRequest
      .input("application_id", sql.Int, application_id)
      .input("status", sql.VarChar(50), "Paid").query(`
          UPDATE tbl_Loan_Application
          SET status = @status
          WHERE application_id = @application_id
        `);

    await transaction.commit();

    res.status(200).json({
      message: "Payment status updated successfully.",
      success: true,
    });
  } catch (error) {
    console.error("updatePaymentStatus error:", error);
    res.status(500).json({ message: "Failed to update payment status", error });
  }
});

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
                UPDATE tbl_Department_Status
                SET status = @status,
                    updated_at = CURRENT_TIMESTAMP 
                FROM tbl_Department_Status AS tas
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
                INSERT INTO tbl_Application_Status_History (application_id, remarks, history_date, initiator)
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

// PATCH METHOD: Update Approval Accounting
router.patch(
  "/loanApplication/updateApprovalAccounting",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { application_id } = req.body;
      const office = "Accounting";

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
                UPDATE tbl_Department_Status
                SET status = @status,
                    updated_at = CURRENT_TIMESTAMP 
                FROM tbl_Department_Status AS tas
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
                INSERT INTO tbl_Application_Status_History (application_id, remarks, history_date, initiator)
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
