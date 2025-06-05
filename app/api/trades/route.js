import { connectToDatabase } from '../../../lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

// GET - Fetch all trades for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const trades = await db.collection('trades').find({ userId }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

// POST - Create a new trade
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      userId, 
      accountId, 
      accountSize, 
      riskPerTrade, 
      tradingPair, 
      strategy, 
      entryPrice, 
      takeProfit, 
      stopLoss, 
      direction, 
      status, 
      analysis, 
      tags, 
      images,
      calculations
    } = body;

    if (!userId || !accountId || !tradingPair || !entryPrice || !takeProfit || !stopLoss) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    const tradeData = {
      userId,
      accountId,
      accountSize: parseFloat(accountSize),
      riskPerTrade: parseFloat(riskPerTrade),
      tradingPair,
      strategy: strategy || null,
      entryPrice: parseFloat(entryPrice),
      takeProfit: parseFloat(takeProfit),
      stopLoss: parseFloat(stopLoss),
      direction,
      status: status || 'planning',
      analysis: analysis || '',
      tags: tags || '',
      images: images || [],
      calculations: calculations || {},
      actualEntry: null,
      actualExit: null,
      actualProfit: null,
      exitReason: null,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('trades').insertOne(tradeData);

    return NextResponse.json({ 
      success: true, 
      tradeId: result.insertedId,
      message: 'Trade created successfully'
    });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
  }
}

// PUT - Update an existing trade
export async function PUT(request) {
  try {
    const body = await request.json();
    const { tradeId, userId, _id, createdAt, ...updateData } = body;

    if (!tradeId || !userId) {
      return NextResponse.json({ error: 'Trade ID and User ID are required' }, { status: 400 });
    }

    // Remove any immutable fields that shouldn't be updated
    const { _id: removeId, userId: removeUserId, createdAt: removeCreatedAt, ...cleanUpdateData } = updateData;

    const { db } = await connectToDatabase();
    
    const result = await db.collection('trades').updateOne(
      { _id: new ObjectId(tradeId), userId },
      { 
        $set: { 
          ...cleanUpdateData, 
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Trade updated successfully' 
    });
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 });
  }
}

// DELETE - Delete a trade
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tradeId = searchParams.get('tradeId');
    const userId = searchParams.get('userId');

    if (!tradeId || !userId) {
      return NextResponse.json({ error: 'Trade ID and User ID are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    const result = await db.collection('trades').deleteOne({
      _id: new ObjectId(tradeId),
      userId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Trade deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 });
  }
} 