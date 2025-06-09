import { connectToDatabase } from '../../../lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

// GET - Fetch AM trades for a user, optionally filtered by account
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const accountId = searchParams.get('accountId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Build query filter
    const filter = { userId };
    if (accountId) {
      filter.accountId = accountId;
    }

    const amTrades = await db.collection('am_trades').find(filter).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ trades: amTrades });
  } catch (error) {
    console.error('Error fetching AM trades:', error);
    return NextResponse.json({ error: 'Failed to fetch AM trades' }, { status: 500 });
  }
}

// POST - Create a new AM trade
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      userId, 
      accountId, 
      // Date & Time
      dateTime,
      manualDateTime,
      weekday,
      month,
      quarter,
      // Basic Trade Info
      accountSize, 
      direction,
      tradingPair, 
      strategy,
      entryPrice, 
      takeProfit, 
      stopLoss,
      // AM Trade Specific Fields
      setup,
      htfFramework,
      dailyProfile,
      entryCandle,
      entryTime,
      entryTimeFrame,
      entryConfluence,
      duration,
      riskPercent,
      plannedRR,
      // Additional fields
      analysis,
      notes,
      riskManagementLessons,
      tags,
      screenshot,
      // Calculated results
      calculatedResults
    } = body;

    if (!userId || !accountId || !tradingPair || !entryPrice || !takeProfit || !stopLoss) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    const amTradeData = {
      userId,
      accountId,
      // Date & Time
      dateTime: dateTime || new Date().toISOString(),
      manualDateTime: manualDateTime || false,
      weekday: weekday || '',
      month: month || '',
      quarter: quarter || '',
      // Basic Trade Info
      accountSize: parseFloat(accountSize) || 0,
      direction: direction || '',
      tradingPair: tradingPair || '',
      strategy: strategy || '',
      entryPrice: parseFloat(entryPrice),
      takeProfit: parseFloat(takeProfit),
      stopLoss: parseFloat(stopLoss),
      // AM Trade Specific Fields
      setup: setup || '',
      htfFramework: htfFramework || '',
      dailyProfile: dailyProfile || '',
      entryCandle: entryCandle || '',
      entryTime: entryTime || '',
      entryTimeFrame: entryTimeFrame || '',
      entryConfluence: entryConfluence || '',
      duration: duration || '',
      riskPercent: riskPercent || '2',
      plannedRR: plannedRR || '',
      // Additional fields
      analysis: analysis || '',
      notes: notes || '',
      riskManagementLessons: riskManagementLessons || '',
      tags: tags || '',
      screenshot: screenshot || null,
      // Calculated results
      calculatedResults: calculatedResults || {},
      // Trade status fields
      status: null, // pending, win, loss
      actualEntry: null,
      actualExit: null,
      actualProfit: null,
      exitReason: null,
      exitNotes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('am_trades').insertOne(amTradeData);

    return NextResponse.json({ 
      success: true, 
      tradeId: result.insertedId,
      message: 'AM Trade created successfully'
    });
  } catch (error) {
    console.error('Error creating AM trade:', error);
    return NextResponse.json({ error: 'Failed to create AM trade' }, { status: 500 });
  }
}

// PUT - Update an existing AM trade
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
    
    const result = await db.collection('am_trades').updateOne(
      { _id: new ObjectId(tradeId), userId },
      { 
        $set: { 
          ...cleanUpdateData, 
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'AM Trade not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'AM Trade updated successfully' 
    });
  } catch (error) {
    console.error('Error updating AM trade:', error);
    return NextResponse.json({ error: 'Failed to update AM trade' }, { status: 500 });
  }
}

// DELETE - Delete an AM trade
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tradeId = searchParams.get('tradeId') || searchParams.get('id');
    const userId = searchParams.get('userId');

    console.log('AM Trade DELETE request:', { tradeId, userId });

    if (!tradeId) {
      console.error('Missing tradeId in delete request');
      return NextResponse.json({ error: 'Trade ID is required' }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(tradeId)) {
      console.error('Invalid tradeId format:', tradeId);
      return NextResponse.json({ error: 'Invalid Trade ID format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Build delete filter
    const deleteFilter = { _id: new ObjectId(tradeId) };
    if (userId) {
      deleteFilter.userId = userId;
    }

    console.log('Delete filter:', deleteFilter);

    // First, check if the trade exists
    const existingTrade = await db.collection('am_trades').findOne(deleteFilter);
    if (!existingTrade) {
      console.error('AM Trade not found:', deleteFilter);
      return NextResponse.json({ error: 'AM Trade not found or access denied' }, { status: 404 });
    }

    console.log('Found trade to delete:', { _id: existingTrade._id, tradingPair: existingTrade.tradingPair });

    // Delete the trade
    const result = await db.collection('am_trades').deleteOne(deleteFilter);

    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      console.error('No trades were deleted');
      return NextResponse.json({ error: 'Failed to delete AM Trade' }, { status: 500 });
    }

    console.log('AM Trade deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'AM Trade deleted successfully',
      deletedTrade: {
        _id: existingTrade._id,
        tradingPair: existingTrade.tradingPair
      }
    });
  } catch (error) {
    console.error('Error deleting AM trade:', error);
    return NextResponse.json({
      error: 'Failed to delete AM trade',
      details: error.message
    }, { status: 500 });
  }
}
