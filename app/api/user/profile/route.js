import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET - Get user profile
export async function GET(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    let decoded;
    try {
      console.log('Verifying token with secret:', JWT_SECRET ? 'Secret available' : 'No secret');
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token verified successfully for userId:', decoded.userId);
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return NextResponse.json({ error: 'Invalid token: ' + error.message }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { fullName, email, currentPassword, newPassword, confirmPassword } = body;

    // Connect to database
    await connectDB();

    // Find user with password for verification
    const user = await User.findById(decoded.userId).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update object
    const updateData = {};

    // Update fullName if provided
    if (fullName && fullName.trim() !== '') {
      updateData.fullName = fullName.trim();
    }

    // Update email if provided and different
    if (email && email.trim() !== '' && email.toLowerCase() !== user.email) {
      // Check if email already exists
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
      
      updateData.email = email.toLowerCase();
    }

    // Handle password change
    if (newPassword && newPassword.trim() !== '') {
      // Validate current password
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
      }

      // Check if passwords match
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedPassword;
    }

    // If no updates provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.toPublicJSON()
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
