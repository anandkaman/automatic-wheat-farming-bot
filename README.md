# automatic-wheat-farming-bot


---

### **Overview**
This bot is a **Minecraft automation bot** designed to farm wheat in a defined area efficiently. It performs tasks such as harvesting fully grown wheat, planting seeds, storing harvested items in a chest, and handling sleeping and waking cycles. The code ensures memory efficiency, smooth transitions between tasks, and handles edge cases like the absence of seeds or farmland.

---

### **Key Features**
1. **Farming Loop**  
   - **Harvesting Crops**: The bot scans for fully grown wheat (`metadata === 7`) within a radius and harvests it using `bot.dig()`.  
   - **Planting Seeds**: After harvesting, it identifies available farmland with air blocks above them and plants seeds there. The bot ensures planting occurs successfully, even retrying after slight delays.  
   - **Adaptive Delays**: Delays are implemented strategically (e.g., 1 second between planting attempts) to account for in-game events like item collection.

2. **Sleep-Wake Cycle**  
   - **Sleeping**: The bot identifies nearby beds and moves to them to sleep.  
   - **Waking Up**: Upon waking, it performs necessary housekeeping tasks like storing items in a chest and restarting the farming loop seamlessly.  

3. **Inventory Management**  
   - The bot automatically deposits all harvested items into a nearby chest.  
   - It retrieves only one seed for planting to minimize inventory clutter.  

4. **Efficient Pathfinding**  
   - The `mineflayer-pathfinder` plugin enables smooth navigation.  
   - The bot calculates the optimal path to farmland, crops, beds, and chests, ensuring efficient movements.

5. **Error Handling**  
   - The bot gracefully handles cases like missing seeds, farmland, or chests.  
   - It retries failed operations (e.g., planting seeds) with adaptive logic.

6. **Memory Optimization**  
   - Unnecessary loops and redundant calculations are avoided.  
   - Event-driven design (e.g., `bot.on('wake')`) ensures tasks are triggered only when necessary.

---

### **Core Functions and Concepts**
1. **Harvest Crops**  
   - The bot uses `bot.findBlock()` to locate fully grown wheat.  
   - It navigates to the crop using `pathfinder.goto()` and harvests it using `bot.dig()`.

   ```javascript
   const crop = bot.findBlock({
       matching: block => block.name === 'wheat' && block.metadata === 7,
       maxDistance: 15,
   });
   ```

2. **Plant Wheat**  
   - The bot checks for farmland with an air block above it.  
   - It retries planting up to 2 times in case of failure, introducing a delay for item collection.

   ```javascript
   const farmlandBlocks = bot.findBlocks({
       matching: block => block.name === 'farmland',
       maxDistance: 10,
       count: 50,
   });
   ```

3. **Store Items**  
   - All items are deposited into a chest using `bot.openContainer()`.  
   - After depositing, the bot retrieves only one seed for planting.

   ```javascript
   await chestContainer.withdraw(seedItem.type, null, 1);
   ```

4. **Sleeping and Waking**  
   - The bot identifies beds with `bot.isABed()` and moves to sleep.  
   - On waking, it stores items and restarts farming.

   ```javascript
   bot.on('wake', async () => {
       await storeItems();
       startFarmingLoop();
   });
   ```

5. **Delay Helper Function**  
   - A promise-based delay function ensures smooth asynchronous operations without blocking.

   ```javascript
   function delay(ms) {
       return new Promise(resolve => setTimeout(resolve, ms));
   }
   ```

---

### **Optimization Highlights**
- **Event-Driven Design**: Ensures tasks only execute when triggered by specific events, reducing unnecessary computations.
- **Retry Mechanism**: Allows the bot to recover gracefully from minor failures (e.g., planting or inventory retrieval).
- **Selective Inventory Management**: Keeps the inventory clean by depositing everything except one seed.

---

### **Potential Future Improvements**
1. **Multi-Crop Support**: Expand the bot to farm other crops like carrots or potatoes.
2. **Dynamic Area Selection**: Allow the bot to dynamically expand or reduce its farming area based on availability.
3. **Error Logging**: Implement a logging system to capture errors for debugging.
4. **Mob Avoidance**: Add logic to detect and avoid hostile mobs during farming.

---

This bot is an excellent example of **automation in Minecraft** using asynchronous JavaScript, plugins like `mineflayer-pathfinder`, and event-driven programming. It's versatile, efficient, and adaptable to various in-game scenarios.
