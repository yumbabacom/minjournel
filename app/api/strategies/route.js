import { connectToDatabase } from '../../../lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

// GET - Fetch all strategies for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const strategies = await db.collection('strategies').find({ userId }).toArray();

    return NextResponse.json({ strategies });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 });
  }
}

// POST - Create a new strategy
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, name, marketType, tradingStyle, description, entryConditions, exitConditions, stopLossLogic, takeProfitLogic, riskPerTrade, maxDailyRisk, maxOpenTrades, positionSizing, indicators, toolsPatterns, tags, status, version } = body;

    if (!userId || !name || !marketType || !tradingStyle) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    const strategyData = {
      userId,
      name,
      marketType,
      tradingStyle,
      description,
      entryConditions,
      exitConditions,
      stopLossLogic,
      takeProfitLogic,
      riskPerTrade,
      maxDailyRisk,
      maxOpenTrades,
      positionSizing,
      indicators,
      toolsPatterns,
      tags,
      status: status || 'testing',
      version: version || '1.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('strategies').insertOne(strategyData);

    return NextResponse.json({ 
      success: true, 
      strategyId: result.insertedId,
      message: 'Strategy created successfully'
    });
  } catch (error) {
    console.error('Error creating strategy:', error);
    return NextResponse.json({ error: 'Failed to create strategy' }, { status: 500 });
  }
}

// PUT - Update an existing strategy
export async function PUT(request) {
  try {
    const body = await request.json();
    const { strategyId, userId, _id, createdAt, ...updateData } = body;

    if (!strategyId || !userId) {
      return NextResponse.json({ error: 'Strategy ID and User ID are required' }, { status: 400 });
    }

    // Remove any immutable fields that shouldn't be updated
    const { _id: removeId, userId: removeUserId, createdAt: removeCreatedAt, ...cleanUpdateData } = updateData;

    const { db } = await connectToDatabase();
    
    const result = await db.collection('strategies').updateOne(
      { _id: new ObjectId(strategyId), userId },
      { 
        $set: { 
          ...cleanUpdateData, 
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Strategy updated successfully' 
    });
  } catch (error) {
    console.error('Error updating strategy:', error);
    return NextResponse.json({ error: 'Failed to update strategy' }, { status: 500 });
  }
}

// DELETE - Delete a strategy
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const strategyId = searchParams.get('strategyId');
    const userId = searchParams.get('userId');

    if (!strategyId || !userId) {
      return NextResponse.json({ error: 'Strategy ID and User ID are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    const result = await db.collection('strategies').deleteOne({
      _id: new ObjectId(strategyId),
      userId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Strategy deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return NextResponse.json({ error: 'Failed to delete strategy' }, { status: 500 });
  }
} 