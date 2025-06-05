import { connectToDatabase } from '../../../lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

// GET - Fetch all accounts for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const accounts = await db
      .collection('accounts')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

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
      message: 'Account created successfully',
      accountId: result.insertedId,
      account: { ...newAccount, _id: result.insertedId }
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

    const { db } = await connectToDatabase();
    
    const result = await db
      .collection('accounts')
      .updateOne(
        { _id: new ObjectId(accountId), userId },
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

    const result = await db
      .collection('accounts')
      .deleteOne({ _id: new ObjectId(accountId), userId });

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