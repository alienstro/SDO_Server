import { Router } from 'express';
import { connectToDatabase } from '../database/dbconnection.js';
const router = Router();
// GET METHOD
router.get('/users', async (req, res) => {
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    try {
        const pool = await connectToDatabase();
        const result = await pool.request().query('SELECT * FROM tbl_Applicant');
        // Check if there is data in table
        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset);
        }
        else {
            res.status(404).json({ message: 'No users found' });
        }
    }
    catch (error) {
        console.error('Failed to retrieve users:', error);
        res.status(500).json({ message: 'Failed to retrieve users', error });
    }
});
router.get('/institutions', async (req, res) => {
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // try {
    //     const pool = await connectToDatabase();
    //     const result = await pool.request().query('SELECT * FROM tblInstitutions');
    //     // Check if there is data in table
    //     if (result.recordset.length > 0) {
    //         res.status(200).json(result.recordset);
    //     } else {
    //         res.status(404).json({ message: 'No institutions found' });
    //     }
    // } catch (error) {
    //     console.error('Failed to retrieve users:', error);
    //     res.status(500).json({ message: 'Failed to retrieve users', error });
    // }
});
router.get('/positions', async (req, res) => {
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // try {
    //     const pool = await connectToDatabase();
    //     const result = await pool.request().query('SELECT * FROM tblPositions');
    //     // Check if there is data in table
    //     if (result.recordset.length > 0) {
    //         res.status(200).json(result.recordset);
    //     } else {
    //         res.status(404).json({ message: 'No positions found' });
    //     }
    // } catch (error) {
    //     console.error('Failed to retrieve users:', error);
    //     res.status(500).json({ message: 'Failed to retrieve users', error });
    // }
});
// POST METHOD
router.post('/users', async (req, res) => {
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // const { userId, Institution, Name, Email, Position, Password, Status } = req.body;
    // if (!userId || !Institution || !Name || !Email || !Position || !Password || !Status) {
    //     return res.status(400).json({ message: 'All fields are required' });
    // }
    // try {
    //     // Hash the password
    //     const hashedPassword = await argon2.hash(Password);
    //     const pool = await connectToDatabase();
    //     const result = await pool.request()
    //         .input('Institution', sql.VarChar, Institution)
    //         .input('Name', sql.VarChar, Name)
    //         .input('Email', sql.VarChar, Email)
    //         .input('Position', sql.VarChar, Position)
    //         .input('Password', sql.VarChar, hashedPassword) // Store hashed password
    //         .input('Status', sql.VarChar, Status)
    //         .query(`
    //         INSERT INTO tblUserAccounts (institution, name, email, position, password, status)
    //         OUTPUT INSERTED.*
    //         VALUES (@Institution, @Name, @Email, @Position, @Password, @Status)
    //         `);
    //     const newUser = result.recordset[0];
    //     res.status(201).json({ message: 'User created successfully', user: newUser });
    // } catch (error) {
    //     console.error('Failed to create user:', error);
    //     res.status(500).json({ message: 'Failed to create user', error });
    // }
});
// BULK USER CREATION
router.post('/users/bulk-create', async (req, res) => {
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // const { users } = req.body;
    // if (!users || !Array.isArray(users) || users.length === 0) {
    //     return res.status(400).json({ message: 'Invalid or empty users list' });
    // }
    // try {
    //     const pool = await connectToDatabase();
    //     const createdUsers: { userId: number; institution: string; name: string; email: string; position: string;  password: string; status: string }[] = [];
    //     const bulkInsertQuery = users.map(async (user) => {
    //         const hashedPassword = await argon2.hash(user.Password);
    //         const result = await pool.request()
    //             .input('Institution', sql.VarChar, user.Institution)
    //             .input('Name', sql.VarChar, user.Name)
    //             .input('Email', sql.VarChar, user.Email)
    //             .input('Position', sql.VarChar, user.Position)
    //             .input('Password', sql.VarChar, hashedPassword)
    //             .input('Status', sql.VarChar, user.Status)
    //             .query(`
    //                 INSERT INTO tblUserAccounts (institution, name, email, position, password, status)
    //                 OUTPUT INSERTED.userId, INSERTED.institution, INSERTED.name, INSERTED.email, INSERTED.position, INSERTED.password, INSERTED.status
    //                 VALUES (@Institution, @Name, @Email, @Position, @Password, @Status)
    //             `);
    //         // Push newly created user details to array
    //         if (result.recordset.length > 0) {
    //             createdUsers.push(result.recordset[0]);
    //         }
    //     });
    //     await Promise.all(bulkInsertQuery);
    //     res.status(201).json({ message: 'Bulk users created successfully', users: createdUsers });
    // } catch (error) {
    //     console.error('Bulk user creation error:', error);
    //     res.status(500).json({ message: 'Failed to create users', error });
    // }
});
router.put('/users/:id', async (req, res) => {
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // EXAMPLE EXAMPLE EXAPLE EXAMPLE EXAMPLE EXAMPLE ONLY 
    // const { id } = req.params;
    // const { institution, name, email, position, password, status } = req.body;
    // if (!institution || !name || !email || !position || !status) {
    //     return res.status(400).json({ message: 'All fields are required except password' });
    // }
    // try {
    //     const pool = await connectToDatabase();
    //     if (password) {
    //         console.log("with password");
    //         // Hash the password if provided
    //         const hashedPassword = await argon2.hash(password);
    //         const result = await pool.request()
    //             .input('Institution', sql.VarChar, institution)
    //             .input('Name', sql.VarChar, name)
    //             .input('Email', sql.VarChar, email)
    //             .input('Position', sql.VarChar, position)
    //             .input('Password', sql.VarChar, hashedPassword)
    //             .input('Status', sql.VarChar, status)
    //             .input('userId', sql.Int, id)
    //             .query(`
    //             UPDATE tblUserAccounts
    //             SET institution = @Institution, name = @Name, email = @Email, position = @Position, password = @Password, status = @Status
    //             OUTPUT INSERTED.*
    //             WHERE userId = @userId
    //             `);
    //         const updatedUser = result.recordset[0];
    //         res.status(200).json({ message: `User updated successfully`, user: updatedUser });
    //     } else {
    //         console.log("without password");
    //         // If no password is provided, update other fields only
    //         const result = await pool.request()
    //             .input('Institution', sql.VarChar, institution)
    //             .input('Name', sql.VarChar, name)
    //             .input('Email', sql.VarChar, email)
    //             .input('Position', sql.VarChar, position)
    //             .input('Status', sql.VarChar, status)
    //             .input('userId', sql.Int, id)
    //             .query(`
    //             UPDATE tblUserAccounts
    //             SET institution = @Institution, name = @Name, email = @Email, position = @Position, status = @Status
    //             OUTPUT INSERTED.*
    //             WHERE userId = @userId
    //             `);
    //         const updatedUser = result.recordset[0];
    //         res.status(200).json({ message: `User updated successfully`, user: updatedUser });
    //     }
    // } catch (error) {
    //     console.error('Error updating user:', error);
    //     res.status(500).json({ message: 'Failed to update user', error });
    // }
});
router.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    res.send(`Delete user with ID ${id}`);
});
export default router;
