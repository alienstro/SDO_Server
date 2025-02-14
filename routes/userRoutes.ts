import express, { Router, Request, Response } from 'express';
import { connectToDatabase } from '../database/dbconnection.js';
import sql from 'mssql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();

// GET METHOD: Fetch Users
router.get('/users', async (req: Request, res: Response): Promise<any> => {
    try {
        const pool = await connectToDatabase();
        const result = await pool.request().query(`
            SELECT TOP (100) 
            [applicant_id], [first_name], [middle_name], [last_name], [ext_name], [email], [institution_name], [position_id], [emp_status], [designation], [password] 
            FROM [sdo_accounting].[dbo].[tbl_Applicant]
        `);

        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset);
        } else {
            res.status(404).json({ message: 'No users found' });
        }
    } catch (error) {
        console.error('Failed to retrieve users:', error);
        res.status(500).json({ message: 'Failed to retrieve users', error });
    }
});

// GET METHOD: Fetch User by Email
router.get('/users/email/:email/:table/:id_type', async (req: Request, res: Response): Promise<any> => {
    const { email, table, id_type } = req.params;
    try {
        const pool = await connectToDatabase();
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query(`
                SELECT password, ${id_type} FROM ${table}
                WHERE email = @email;
            `);

        const user = result.recordset[0];
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Failed to retrieve user:', error);
        res.status(500).json({ message: 'Failed to retrieve user', error });
    }
});

// GET METHOD: Fetch User Profile
router.get('/users/profile/:role/:id', async (req: Request, res: Response): Promise<any> => {
    const { role, id } = req.params;

    try {
        const pool = await connectToDatabase();
        let query = '';

        if (role === 'applicant') {
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

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(query);

        const profile = result.recordset[0];
        if (profile) {
            res.status(200).json(profile);
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        console.error('Failed to retrieve profile:', error);
        res.status(500).json({ message: 'Failed to retrieve profile', error });
    }
});

// POST METHOD: User Login
router.post('/login', async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const pool = await connectToDatabase();
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query(`
                SELECT staff_id, first_name, last_name, email, password, department_id 
                FROM tbl_Staff 
                WHERE email = @email;
            `);

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate JWT token
        const token = generateJWT(user.staff_id, user.first_name, user.last_name, user.email, user.department_id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            role: user.department_id
        });

    } catch (error) {
        console.error('Failed to login user:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error
        });
    }
});

const generateJWT = (staff_id: number, first_name: string, last_name: string, email: string, role: string) => {
    const JWT_SECRET = process.env.SECRET_KEY || 'tokentest'

    const payload = {
        iss: "localhost",
        aud: "localhost",
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
        data: {
            staff_id,
            first_name,
            last_name,
            email,
            role
        },
    };

    return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
};

// POST METHOD: Add User
router.post('/users', async (req: Request, res: Response): Promise<any> => {
    const { first_name, middle_name, last_name, ext_name, email, institution_name, position_id, emp_status, designation, password } = req.body;

    if (!first_name || !last_name || !email || !institution_name || !position_id || !emp_status || !designation || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const pool = await connectToDatabase();
        const result = await pool.request()
            .input('first_name', sql.VarChar, first_name)
            .input('middle_name', sql.VarChar, middle_name)
            .input('last_name', sql.VarChar, last_name)
            .input('ext_name', sql.VarChar, ext_name)
            .input('email', sql.VarChar, email)
            .input('institution_name', sql.VarChar, institution_name)
            .input('position_id', sql.Int, position_id)
            .input('emp_status', sql.VarChar, emp_status)
            .input('designation', sql.VarChar, designation)
            .input('password', sql.VarChar, password)
            .query(`
                INSERT INTO [sdo_accounting].[dbo].[tbl_Applicant] 
                ([first_name], [middle_name], [last_name], [ext_name], [email], [institution_name], [position_id], [emp_status], [designation], [password])
                VALUES (@first_name, @middle_name, @last_name, @ext_name, @email, @institution_name, @position_id, @emp_status, @designation, @password)
            `);

        res.status(201).json({ message: 'User added successfully', user: req.body });
    } catch (error) {
        console.error('Failed to add user:', error);
        res.status(500).json({ message: 'Failed to add user', error });
    }
});

export default router;
