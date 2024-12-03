const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3'); // For 3D vector positions
const pathfinder = require('mineflayer-pathfinder').pathfinder; // Pathfinder plugin
const { Movements, goals } = require('mineflayer-pathfinder'); // For navigation

const bot = mineflayer.createBot({
    host: 'localhost',
    username: 'wheat_farmer',
});

bot.loadPlugin(pathfinder); // Load pathfinding plugin

let isRunning = false; // Control flag for the farming loop
let shouldSleep = false; // Flag for sleep function

bot.once('spawn', async () => {
    const defaultMovements = new Movements(bot, bot.registry);
    bot.pathfinder.setMovements(defaultMovements);
    //bot.chat("Bot has spawned and is ready for farming! Commands: start, stop, sleep, wakeup, store, exit.");
    startFarmingLoop();
});

// Commands to control the bot
bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const command = message.toLowerCase();

    switch (command) {
        case 'start':
            startFarmingLoop();
            break;
        case 'stop':
            stopFarmingLoop();
            break;
        case 'sleep':
            shouldSleep = true;
            stopFarmingLoop();
            goToSleep();
            break;
        case 'wakeup':
            wakeUp();
            break;
        case 'store':
            storeItems();
            break;
        case 'exit':
            exitBot();
            break;
        default:
            bot.chat("");
    }
});

// Main farming loop
async function startFarmingLoop() {
    if (isRunning) {
        //bot.chat("Farming loop is already running.");
        return;
    }

    isRunning = true;
    bot.chat("Starting the farming loop...");

    while (isRunning) {
        const harvested = await harvestCrops(); // Try to harvest crops

        if (harvested) {
            await delay(500);
            await plantWheat(); // Plant seeds if harvested
            await delay(7500); // Wait after planting
        } else {
            //bot.chat("No wheat to harvest. Waiting...");
            await delay(15000); // Wait if no wheat was harvested
        }

        if (shouldSleep) {
            //bot.chat("Stopping farming loop for sleep...");
            await delay(1000); // Small delay to ensure smooth transition
            return;
        }
    }

    bot.chat("Farming loop stopped.");
}

// Stop the farming loop
function stopFarmingLoop() {
    if (!isRunning) {
       // bot.chat("No active loop to stop.");
        return;
    }
    isRunning = false;
   // bot.chat("Stopping the farming loop after current task.");
}

// Plant seeds
async function plantWheat() {
    const seeds = bot.inventory.items().find(item => item.name.includes('seeds'));
    if (!seeds) {
       // bot.chat("No seeds found in inventory.");
        return;
    }

    for (let iteration = 1; iteration <= 2; iteration++) {
        //bot.chat(`Planting iteration ${iteration}...`);

        const farmlandBlocks = bot.findBlocks({
            matching: block => block.name === 'farmland',
            maxDistance: 10,
            count: 50, // Maximum number of farmland blocks to consider
        });

        if (farmlandBlocks.length === 0) {
          //  bot.chat("No farmland nearby to plant seeds.");
            return;
        }

        for (const pos of farmlandBlocks) {
            const blockAbove = bot.blockAt(pos.offset(0, 1, 0));

            // Ensure the block above farmland is air or empty
            if (!blockAbove || blockAbove.name === 'air') {
                try {
                    await bot.pathfinder.goto(new goals.GoalNear(pos.x, pos.y, pos.z, 1)); // Move close to the block
                    await bot.equip(seeds, 'hand'); // Equip seeds
                    await bot.placeBlock(bot.blockAt(pos), new Vec3(0, 1, 0)); // Plant seeds
                   // bot.chat(`Seeds planted at ${pos.x}, ${pos.y}, ${pos.z}`);
                } catch (err) {
                   // bot.chat(`Failed to plant seeds at ${pos.x}, ${pos.y}, ${pos.z}: ${err.message}`);
                }
            }
        }

        // Add a slight delay between iterations
        if (iteration < 2) {
            await delay(1000);
        }
    }

   // bot.chat("Finished planting wheat.");
}


// Harvest crops
async function harvestCrops() {
    const crop = bot.findBlock({
        matching: block => block.name === 'wheat' && block.metadata === 7, // Fully grown wheat
        maxDistance: 15,
    });

    if (!crop) {
       // bot.chat("No fully grown wheat nearby.");
        return false;
    }

    try {
        // Move to the exact block to harvest
        await bot.pathfinder.goto(new goals.GoalNear(crop.position.x, crop.position.y, crop.position.z, 0));

        // Wait for 100ms to make sure the bot centers itself on the block
        await delay(100);

        // Slightly adjust bot's position to be centered on the crop block
        bot.lookAt(crop.position.offset(0.5, 0, 0));

        // Harvest the crop
        await bot.dig(crop);
        //bot.chat("Wheat harvested!");
        return true;
    } catch (err) {
       // bot.chat(`Failed to harvest crops: ${err.message}`);
        return false;
    }
}

// Sleep function
async function goToSleep() {
    const bed = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 25,
    });

    if (!bed) {
       // bot.chat("No bed nearby to sleep.");
        return;
    }

    try {
        await bot.pathfinder.goto(new goals.GoalNear(bed.position.x, bed.position.y, bed.position.z, 1));
        await bot.sleep(bed);
        //bot.chat("Bot is now sleeping.");
    } catch (err) {
        bot.chat(`Failed to sleep: ${err.message}`);
    }
}


// Wakeup function
async function wakeUp() {
    try {
        await bot.wake();
       // bot.chat("Bot woke up, storing items and restarting the farming loop...");
        await storeItems();
        startFarmingLoop();
    } catch (err) {
       // bot.chat(`Failed to wake up: ${err.message}`);
    }
    
}
bot.on('wake', async () => {
    bot.chat("Wokeup");
    shouldSleep = false;        
    try {
       
        // Store items first
       // bot.chat("Storing items...");
        await storeItems();
        await delay(3000);
        // Start the farming loop
       // bot.chat("Resuming farming tasks...");
        startFarmingLoop();
    } catch (err) {
       // bot.chat(`Error during post-wakeup actions: ${err.message}`);
    }
});



// Store items in nearby chest
async function storeItems() {
    const chest = bot.findBlock({
        matching: block => block.name.includes('chest'),
        maxDistance: 50,
    });

    if (!chest) {
       // bot.chat("No chest nearby to store items.");
        return;
    }

    try {
        await bot.pathfinder.goto(new goals.GoalNear(chest.position.x, chest.position.y, chest.position.z, 1));
        const chestContainer = await bot.openContainer(chest); // Open the chest as a container

        // Store all items from the bot's inventory
        for (const item of bot.inventory.items()) {
            try {
                await chestContainer.deposit(item.type, null, item.count);
               // bot.chat(`Stored ${item.count} ${item.name}`);
            } catch (err) {
               // bot.chat(`Failed to store ${item.name}: ${err.message}`);
            }
        }

        // Retrieve one seed from the chest
        const seedItem = chestContainer.containerItems().find(item => item.name.includes('seeds'));
        if (seedItem) {
            try {
                await chestContainer.withdraw(seedItem.type, null, 1); // Withdraw only one seed
              //  bot.chat("Retrieved 1 seed from the chest.");
            } catch (err) {
                //bot.chat(`Failed to retrieve seed: ${err.message}`);
            }
        } else {
           // bot.chat("No seeds available in the chest to retrieve.");
        }

        chestContainer.close(); // Always close the container
    } catch (err) {
       // bot.chat(`Failed to store items: ${err.message}`);
    }
}




// Exit function
async function exitBot() {
    bot.chat("Exiting... Completing current tasks first.");

    if (isRunning) {
        stopFarmingLoop();
        await delay(5000); // Give the bot time to finish any ongoing tasks
    }

    bot.quit();
    process.exit(0);
}

// Helper delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
