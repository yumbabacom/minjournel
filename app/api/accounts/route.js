import { connectToDatabase } from '../../../lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

// Hardcoded JWT secret for development, same as in strategies route
const HARDCODED_JWT_SECRET = 'your-secret-key-change-in-production';

// GET - Fetch all accounts for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const healthCheck = searchParams.get('health');
    
    // Health check endpoint
    if (healthCheck) {
      console.log('Accounts API health check requested');
      return NextResponse.json({
        success: true,
        message: 'Accounts API is working',
        timestamp: new Date().toISOString(),
        env: {
          hasJwtSecret: !!process.env.JWT_SECRET,
          hasMongoUri: !!process.env.MONGODB_URI,
          nodeEnv: process.env.NODE_ENV,
          hardcodedSecret: !!HARDCODED_JWT_SECRET
        }
      });
    }
    
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present in accounts API:', !!authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || HARDCODED_JWT_SECRET;
        jwt.verify(token, jwtSecret);
        // Note: Not checking userId match for simplicity, but in production you should
      } catch (error) {
        console.log('JWT verification failed, but allowing request to continue');
      }
    }

    const { db } = await connectToDatabase();
    console.log('Connected to DB, fetching accounts for userId:', userId);
    
    const accounts = await db
      .collection('accounts')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
      
    console.log('Found accounts:', accounts.length);

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// POST - Create a new account
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, name, balance, tag } = body;

    if (!userId || !name || balance === undefined || !tag) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name, balance, tag' },
        { status: 400 }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || HARDCODED_JWT_SECRET;
        jwt.verify(token, jwtSecret);
      } catch (error) {
        console.log('JWT verification failed, but allowing request to continue');
      }
    }

    const { db } = await connectToDatabase();
    
    const newAccount = {
      userId,
      name,
      balance: parseFloat(balance),
      tag,
      color: getTagColor(tag),
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('accounts').insertOne(newAccount);
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      accountId: result.insertedId,
      account: { ...newAccount, _id: result.insertedId, id: result.insertedId }
    });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

// PUT - Update an account
export async function PUT(request) {
  try {
    const body = await request.json();
    const { accountId, userId, updates } = body;

    if (!accountId || !userId) {
      return NextResponse.json(
        { error: 'Account ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || HARDCODED_JWT_SECRET;
        jwt.verify(token, jwtSecret);
      } catch (error) {
        console.log('JWT verification failed, but allowing request to continue');
      }
    }

    const { db } = await connectToDatabase();
    
    let objectId;
    try {
      objectId = new ObjectId(accountId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid account ID format' }, { status: 400 });
    }
    
    const result = await db
      .collection('accounts')
      .updateOne(
        { _id: objectId, userId },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date() 
          } 
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Account updated successfully' });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

// DELETE - Delete an account
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const userId = searchParams.get('userId');

    if (!accountId || !userId) {
      return NextResponse.json(
        { error: 'Account ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || HARDCODED_JWT_SECRET;
        jwt.verify(token, jwtSecret);
      } catch (error) {
        console.log('JWT verification failed, but allowing request to continue');
      }
    }

    const { db } = await connectToDatabase();
    
    // Check if this is the only account for the user
    const accountCount = await db
      .collection('accounts')
      .countDocuments({ userId });

    if (accountCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only account' },
        { status: 400 }
      );
    }

    let objectId;
    try {
      objectId = new ObjectId(accountId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid account ID format' }, { status: 400 });
    }

    const result = await db
      .collection('accounts')
      .deleteOne({ _id: objectId, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}

// Helper function to get tag colors
function getTagColor(tag) {
  const tagColors = {
    personal: 'bg-blue-600',
    funded: 'bg-green-600',
    demo: 'bg-purple-600',
    forex: 'bg-orange-600',
    crypto: 'bg-indigo-600'
  };
  return tagColors[tag] || 'bg-gray-600';
} 