
import { supabase as supabaseClient } from './supabaseClient';
const supabase = supabaseClient as any;
import { supabaseService } from './services/supabaseService';

async function testLogs() {
    try {
        console.log("Logging in...");
        // Use the admin credentials if known, or just any user.
        // For this test, I'll try to find a user first.
        const { data: users } = await supabase.from('users').select('username').limit(1);
        if (users && users.length > 0) {
            const username = users[0].username;
            console.log("Found user:", username);
            // We don't know the password, but maybe we can just set the session if we have the secret?
            // No, we don't have the secret.
        }

        console.log("Testing log_event RPC...");
        const { error: rpcError } = await supabase.rpc('log_event', {
            p_level: 'INFO',
            p_event: 'TEST_RPC_LOG',
            p_message: 'Test message from RPC at ' + new Date().toISOString()
        });
        if (rpcError) {
            console.error("RPC failed:", rpcError);
        } else {
            console.log("RPC successful.");
        }
        
        console.log("Checking exact count of system_logs...");
        const { count, error: countError } = await supabase.from('system_logs').select('*', { count: 'exact', head: true });
        if (countError) {
            console.error("Count check failed:", countError);
        } else {
            console.log("Total logs in table:", count);
        }
        const { data: colData, error: colError } = await supabase.from('system_logs').select('*').limit(1);
        if (colError) {
            console.error("Column check failed:", colError);
        } else {
            console.log("Columns found:", colData ? Object.keys(colData[0] || {}) : 'None');
        }
        const { error: insertError } = await supabase.from('system_logs').insert({
            level: 'INFO',
            event: 'DIRECT_INSERT_TEST',
            message: 'Direct insert test at ' + new Date().toISOString()
        });
        if (insertError) {
            console.error("Direct insert failed:", insertError);
        } else {
            console.log("Direct insert successful.");
        }
        
        console.log("Fetching logs directly from system_logs table...");
        const { data: directLogs, error: directError } = await supabase.from('system_logs').select('*').limit(10);
        if (directError) {
            console.error("Direct fetch failed:", directError);
        } else {
            console.log("Direct logs fetched:", directLogs?.length);
            if (directLogs && directLogs.length > 0) {
                console.log("First log entry:", directLogs[0]);
            }
        }
        
        console.log("Fetching logs via supabaseService...");
        const logs = await supabaseService.getSystemLogs();
        console.log("Logs fetched:", logs.length);
        if (logs.length > 0) {
            console.log("Last log:", logs[0]);
        }
    } catch (error) {
        console.error("Error testing logs:", error);
    }
}

testLogs();
