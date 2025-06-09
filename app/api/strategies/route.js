import { connectToDatabase } from '../../../lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

// Hardcoded JWT secret for development
const HARDCODED_JWT_SECRET = 'your-secret-key-change-in-production';

// Simple health check - you can test this by visiting /api/strategies?health=true
// GET - Fetch all strategies for a user or health check
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const healthCheck = searchParams.get('health');
  
  // Health check endpoint
  if (healthCheck) {
    console.log('Health check requested');
    return NextResponse.json({
      success: true,
      message: 'API is working',
      timestamp: new Date().toISOString(),
      env: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasMongoUri: !!process.env.MONGODB_URI,
        nodeEnv: process.env.NODE_ENV,
        hardcodedSecret: !!HARDCODED_JWT_SECRET
      }
    });
  }

  console.log('API /api/strategies GET called');
  
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return NextResponse.json({ 
        success: false, 
        message: 'No token provided' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Token extracted, length:', token.length);
    
    // Verify token
    let decoded;
    try {
      // Try with environment variable first, then fallback to hardcoded secret
      const jwtSecret = process.env.JWT_SECRET || HARDCODED_JWT_SECRET;
      console.log('Using JWT secret:', jwtSecret ? 'Secret found' : 'No secret available');
      
      decoded = jwt.verify(token, jwtSecret);
      console.log('Token decoded successfully:', decoded);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token: ' + jwtError.message
      }, { status: 401 });
    }
    
    const userId = decoded.userId;
    console.log('Token verified, userId:', userId);

    if (!userId) {
      console.log('No userId in token');
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token - no user ID' 
      }, { status: 401 });
    }

    // Connect to MongoDB using the proper connection function
    console.log('Attempting to connect to MongoDB...');
    const { db } = await connectToDatabase();
    console.log('MongoDB connected successfully');
    
    const strategiesCollection = db.collection('strategies');

    // Fetch user's strategies
    console.log('Fetching strategies for user:', userId);
    const strategies = await strategiesCollection
      .find({ userId: userId.toString() })
      .sort({ createdAt: -1 })
      .toArray();

    console.log('Found strategies:', strategies.length);

    return NextResponse.json({
      success: true,
      strategies: strategies || []
    });

  } catch (error) {
    console.error('Error in /api/strategies GET:', error);
    
    // Return proper JSON error response
    if (error.name === 'JsonWebTokenError') {
      console.log('JWT Error:', error.message);
      return NextResponse.json({
        success: false,
        message: 'Invalid token: ' + error.message
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch strategies',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
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