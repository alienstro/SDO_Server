import express, { Router, Request, Response } from "express";
import { connectToDatabase } from "../database/dbconnection.js";
import sql from "mssql";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import argon2 from "argon2";

const router = Router();

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

// POST METHOD: Staff Login
router.post(
  "/staffLogin",
  async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
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
      const isPasswordValid = await argon2.verify(user.password, password);
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
  }
);

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

// POST METHOD: Applicant Login
router.post(
  "/applicantLogin",
  async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    try {
      const pool = await connectToDatabase();
      const result = await pool.request().input("email", sql.VarChar, email)
        .query(`
          SELECT TOP 1 *
          FROM tbl_Applicant
          WHERE email = @email;
        `);

      const user = result.recordset[0];

      // Use a generic message to avoid user enumeration
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify Argon2 hash
      const isPasswordValid = await argon2.verify(user.password, password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = generateJWTApplicant(
        user.applicant_id,
        user.first_name,
        user.middle_name,
        user.last_name,
        user.ext_name,
        user.email,
        user.designation
      );

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        role: user.department_id, // if applicants don’t have this, remove it
      });
    } catch (error) {
      console.error("Failed to login user:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred",
        error,
      });
    }
  }
);

// GET METHOD: Fetch Applicant
router.get(
  "/applicantUser",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const pool = await connectToDatabase();
      const result = await pool.request().query(`
            SELECT  
            *
            FROM [sdo_accounting].[dbo].[tbl_Applicant]
        `);

      if (result.recordset.length > 0) {
        res.status(200).json(result.recordset);
      } else {
        res.status(404).json({ message: "No users found" });
      }
    } catch (error) {
      console.error("Failed to retrieve users:", error);
      res.status(500).json({ message: "Failed to retrieve users", error });
    }
  }
);

// GET METHOD: Fetch Staffs
router.get(
  "/staffUser",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const pool = await connectToDatabase();
      const result = await pool.request().query(`
            SELECT  
            *
            FROM [sdo_accounting].[dbo].[tbl_Staff]
        `);

      if (result.recordset.length > 0) {
        res.status(200).json(result.recordset);
      } else {
        res.status(404).json({ message: "No staffs found" });
      }
    } catch (error) {
      console.error("Failed to retrieve staffs:", error);
      res.status(500).json({ message: "Failed to retrieve staffs", error });
    }
  }
);

// POST METHOD: Add Applicant User
router.post(
  "/applicantUser",
  async (req: Request, res: Response): Promise<any> => {
    const {
      first_name,
      middle_name,
      last_name,
      ext_name,
      email,
      institution_name,
      designation,
      password,
    } = req.body;



    try {
      const password_hash = await argon2.hash(password, {
        type: argon2.argon2id,
        timeCost: 3,
        memoryCost: 19456,
        parallelism: 1,
      });

      const pool = await connectToDatabase();
      await pool
        .request()
        .input("first_name", sql.VarChar, first_name)
        .input("middle_name", sql.VarChar, middle_name)
        .input("last_name", sql.VarChar, last_name)
        .input("ext_name", sql.VarChar, ext_name)
        .input("email", sql.VarChar, email)
        .input("institution_name", sql.VarChar, institution_name)
        .input("emp_status", sql.VarChar, "Active")
        .input("designation", sql.VarChar, designation)
        .input("password", sql.VarChar, password_hash).query(`
        INSERT INTO [sdo_accounting].[dbo].[tbl_Applicant] 
        ([first_name], [middle_name], [last_name], [ext_name], [email], [institution_name], [emp_status], [designation], [password])
        VALUES (@first_name, @middle_name, @last_name, @ext_name, @email, @institution_name, @emp_status, @designation, @password)
      `);

      res.status(201).json({ success: true, message: "Applicant added successfully" });
    } catch (error) {
      console.error("Failed to add user:", error);
      res.status(500).json({ message: "Failed to add user", error });
    }
  }
);

// POST METHOD: Add Staff User
router.post(
  "/staffUser",
  async (req: Request, res: Response): Promise<any> => {
    const {
      first_name,
      middle_name,
      last_name,
      ext_name,
      email,
      designation,
      password,
      department_id,
    } = req.body;

    try {
      const password_hash = await argon2.hash(password, {
        type: argon2.argon2id,
        timeCost: 3,
        memoryCost: 19456,
        parallelism: 1,
      });

      const pool = await connectToDatabase();
      await pool
        .request()
        .input("first_name", sql.VarChar, first_name)
        .input("middle_name", sql.VarChar, middle_name)
        .input("last_name", sql.VarChar, last_name)
        .input("ext_name", sql.VarChar, ext_name)
        .input("email", sql.VarChar, email)
        .input("department_id", sql.Int, department_id)
        .input("emp_status", sql.VarChar, "Active")
        .input("designation", sql.VarChar, designation)
        .input("password", sql.VarChar, password_hash).query(`
        INSERT INTO [sdo_accounting].[dbo].[tbl_Staff] 
        ([first_name], [middle_name], [last_name], [ext_name], [email], [department_id], [emp_status], [designation], [password])
        VALUES (@first_name, @middle_name, @last_name, @ext_name, @email, @department_id, @emp_status, @designation, @password)
      `);

      res.status(201).json({ success: true, message: "Staff added successfully" });
    } catch (error) {
      console.error("Failed to add staff:", error);
      res.status(500).json({ message: "Failed to add staff", error });
    }
  }
);


const generateJWTApplicant = (
  applicant_id: number,
  first_name: string,
  middle_name: string,
  last_name: string,
  ext_name: string,
  email: string,
  designation: string
) => {
  const JWT_SECRET = process.env.SECRET_KEY || "tokentest";

  const payload = {
    iss: "localhost",
    aud: "localhost",
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    data: {
      applicant_id,
      first_name,
      middle_name,
      last_name,
      ext_name,
      email,
      designation,
    },
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256" });
};

export default router;
