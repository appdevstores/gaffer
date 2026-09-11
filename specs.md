 📋 Gaffer: Master App Architecture & Build SpecificationTarget AI Developer: Devin AIDeployment Scope: iOS (iPhone/iPad App Store) & Android (Google Play Store)System Architecture Constraint: 100% Standalone, Local Device Key-Value Storage Only (Offline-First). No cloud databases.🛠️ 1. Core Framework & Responsive Layout StrategyEngine Stack: Flutter (Dart) or React Native (TypeScript) using native Canvas layout renderings.Local Storage Engine: Use Hive / Isar (Flutter) or SQLite / WatermelonDB (React Native) to store data directly as fast binary objects on the local hardware filesystem.UI Layout Breakpoint (600dp Responsive Window):Phone View (<600dp): Vertical scroll interface. Match canvas on top (70% viewport), sub-bench / timeline actions scrolling horizontally beneath it.Tablet / iPad View (≥600dp): Horizontal split-screen frame. The interactive tactical field canvas occupies exactly 70% of the viewport width. Control sidebars, season dashboards, and multi-column bench rosters sit permanently docked on the right-hand 30% panel.🗄️ 2. Standalone Relational Data Schematypescriptinterface Season {
  id: string;               // UUID key
  name: string;             // User text string input (e.g., "Fall 2026 Rec")
  isActive: boolean;        // Global lifecycle flag
  startDate: string;
  endDate: string | null;
}

interface Player {
  id: string;
  seasonId: string;         // Enforces data isolation between separate seasons
  name: string;
  jerseyNumber: number;
  avatarSeed: string;       // Unique seed passed to an avatar renderer (e.g., Dicebear)
  status: 'field' | 'bench';
  shiftSeconds: number;     // Active rolling continuous stint counter
  totalSeconds: number;     // Global cumulative match playing counter
  matchGoals: number;
}

interface MatchSession {
  id: string;
  seasonId: string;
  teamName: string;
  opponentName: string;
  gameFormat: '4v4' | '7v7' | '9v9' | '11v11';
  tacticalShape: string;    // Selected line preset system (e.g., "diamond", "4-4-2")
  currentStage: 'PRE_MATCH' | 'FIRST_HALF' | 'BREAK' | 'SECOND_HALF' | 'FULL_TIME';
  fieldOrientation: 'NORMAL' | 'FLIPPED'; // Track 180° field flips
  targetHalfMinutes: number;
  homeScore: number;
  awayScore: number;
  elapsedSeconds: number;   // Master running clock stopwatch counter
}

interface MatchEvent {
  id: string;
  matchId: string;
  timestampSeconds: number;
  type: 'GOAL_HOME' | 'GOAL_AWAY';
  playerScorerId: string | null; // Null if conceded to opponent
}
Use code with caution.🚀 3. Sequential App Onboarding Wizard & Flow ControlDevin AI must implement the boot-up sequences following this strict execution order:Step 1: The Season Lifecycle Gate LauncherUpon launch, evaluate local storage. Present two primary utility workflows:Start a New Season: Accepts textual input for name, generates a new season_id, sets isActive: true, and proceeds to Step 2.Open an Existing Season: Renders an interactive vertical menu list of previous locally saved seasons. Selecting one pulls that specific season_id context array and skips straight to Step 4 (or directly into the live match engine if a game is in progress).Season Lifecycle End ("Stop Season"): Tapping the stop feature flags isActive: false and logs an endDate. This freezes that historical database segment from active modifications.Step 2: Team Name Memory CapturePrompt text input for Team Name and Opponent Name.Memory Rule: Once the team name string is captured, save it as a local global variable default. For all subsequent game creation workflows under this season profile, auto-populate this input text area and shift input focus directly to Step 3.Step 3: Fast-Focus Roster CompilationProvide form entry for Name and Jersey Number.Touch Optimization: Submitting a player entry appends a newly generated profile object to the active roster array. Immediately execute a clear input command and programmatically enforce FocusNode.requestFocus() back onto the player name entry box. This allows the coach to rapid-fire input an entire roster list consecutively without tapping text boxes again.🏃 4. Tactical Canvas Coordinate & Boundary EngineRule A: The Tap-and-Move Substitution ErgonomicsTo prevent user hand occlusion ("fat-finger covering errors") over elements during chaotic sideline events, explicitly forbid long-press drags or real-time object tracking across the screen viewport. Program a two-tap command pattern:First Tap: Tapping a player item in the roster list or substitute bench updates a cursor global pointer tracker (activeSelectionID = selectedPlayer.id). Apply a high-contrast pulsing border wrapper around this active item icon.Adaptive Indication: If the clipboard contains a player ID, inject glowing structural placement target ring indicators across all available layout paths on the tactical pitch canvas graphic.Second Tap: Tapping an occupied position slot on the pitch grid executes an immediate state swap algorithm:Save the exiting player's continuous match runtime logs: totalSeconds += shiftSeconds.Update the exiting node property states: status = 'bench', shiftSeconds = 0.Transition the arriving target node property states: status = 'field', reset its initialization shift time to 0, and inherit the canvas location percentages.Rule B: The Local Auto-Sorting Bench ArrayWhen a player's layout status resolves to status === 'bench', parse them inside a secondary visual rendering array buffer.Enforce a persistent ascending chronological sorting function query:typescriptconst sortedBench = activePlayers.filter(p => p.status === 'bench').sort((a, b) => a.totalSeconds - b.totalSeconds);
Use code with caution.Late Arrival Entry Rule: Tapping the text interface mid-game allows the user to add late-arriving players to the field roster list. These elements initialize with a runtime calculation footprint of exactly zero (totalSeconds: 0). The auto-sorting loop must naturally pop them to the immediate head-of-line position queue on the bench layout.Rule C: Locked Boundary Constraints & Track LocksThe Pitch Zone Bounding Box: Interactive players can move anywhere on the green field boundaries, but are blocked from entering the technical box area.The Technical Area Box: Render a separate layout rectangle pinned entirely outside the field boundaries next to the bench area.Boundary Enforcement Rules:Players are strictly forbidden from being dropped or placed inside the Technical Area container coordinate constraints.The two dedicated Coach nodes (Head Coach, Assistant Coach) are permanently trapped inside this Technical Area wrapper box.Single Axis Lock: Lock the drag constraints of the coach nodes strictly to the vertical plane (axis="y"). The coach elements can only glide up and down along the touchline sidebar track.⏱️ 5. Whistle Overtime Clock & Live Animations EngineRule A: The Overtime Clock EngineWhen the stopwatch counts up to the predefined interval limit (currentMinutes >= targetHalfMinutes), do not programmatically trigger a hard pause or clock reset.The stopwatch loop must continue counting upwards into stoppage time intervals smoothly.Visual Alert Hooks: When entering stoppage parameters, assign a layout state modifier class that shifts the stopwatch timer text color to a highly visible bright red.All stage shifts (First Half → Break → Second Half → Full Time) remain fully gated behind manual user button selection commands timed to the referee's physical whistle.Rule B: Live-State Match AnimationsCreate a global reactive listener tied directly to the boolean status state of the match clock (isClockActive).When isClockActive === true: Apply relative structural animation loops to nested canvas asset child node viewframes:Field Tokens: Execute a soft vertical bounce loop via CSS keyframes or layout interpolations (translate translateY(-4px) over an alternating 0.8s timeline interval pattern) to simulate live-action jogging.Coach Tokens: Activate an automated continuous linear pacing timeline, gliding the coach icons up and down the vertical spans of their Technical Area track.The Soccer Ball: Run a random indexing loop routine. Every few seconds, pick a random layout coordinate map bound to an active field player, and smoothly interpolate the ball token's placement parameters (transition: left 1.2s, top 1.2s) to glide possession around the team organically.When isClockActive === false: Instantly pause all ongoing translation script timelines and freeze all moving elements statically in their current coordinate positions.📐 6. Context-Aware Formations Matrix & Field FlippingRule A: Size Filtered FormationsIf the parent game configuration property evaluates to gameFormat === '4v4', reveal only structural options mapped to young age divisions: Diamond (1-2-1), Box Square (2-2), and Defensive 2-1-1. Hide all 11v11 configurations.If the parent configuration matches gameFormat === '11v11', present options like 4-4-2, 4-3-3, 5-3-2, and 3-5-2.Relative Spacing Translation Engine: When a formation system option is selected, fetch coordinate points evaluated entirely using canvas window size percentages (x_pct, y_pct) rather than raw fixed hardware pixel units. Snap active pitch elements directly onto these new line maps, automatically matching the display dimension profiles of whatever screen factor (iPhone vs. iPad) is active. Hide any unassigned system positions completely.Rule B: Coordinate Geometry Field Flipped Array (Coin-Toss & Halftime)Provide a global "🔄 Flip Sides" button shortcut accessible on the live match-day screen view.When a manual flip or automatic halftime transition changes the state parameter to fieldOrientation = 'FLIPPED', execute an inversion script across all active coordinates by rotating the map 180 degrees using basic matrix mirroring:typescriptfunction invertPitchCoordinates(fieldPlayers: Player[]) {
  return fieldPlayers.map(p => {
    if (p.status === 'field') {
      p.x_pct = 100 - p.x_pct;
      p.y_pct = 100 - p.y_pct;
    }
    return p;
  });
}
Use code with caution.Cascading Layout Shifts: Mirroring coordinates must mirror goal identities, shift the Technical Area and its pacing coaches to the opposite sideline to stay matched with the team's side of the bench, and swap the score title alignment labels instantly.🧹 7. Storage Management & Zero-Server Data ExportA. Non-Server System Email Client RoutingWhen the match shifts to FULL_TIME, compile the internal data arrays into a text payload block structure string and route it to the system email client layout without passing through cloud services:typescriptconst mailtoLink = `mailto:?subject=Gaffer Match Summary Report&body=${encodeURIComponent(formattedSummaryString)}`;
Use code with caution.B. Cascading Space EraserProvide a local checklist interface allowing the user to select specific historic match database elements to wipe device memory directories. The execution function must invoke clean cleanup cycles across keys to guarantee zero residual trace files linger:typescriptasync function purgeStoredMatch(targetId: string) {
  await db.box('matches').delete(targetId);
  await db.box('events').deleteWhere(row => row.matchId === targetId);
  await db.box('minutes').deleteWhere(row => row.matchId === targetId);
}
Use code with caution.🔒 8. In-App Purchase Grandfathering FrameworkVersion 1.x Standard Logic Hook: Initialize the framework package deployment state with unrestricted access settings hardcoded locally: isPremiumUnlocked = true.Version 2.x Layer Upgrade Pattern: When adding in-app store subscription check dependencies in later iterations, check the metadata database properties tracking the original application receipt date wrapper first:typescriptconst downloadReceiptVersion = await StoreProvider.getOriginalAppVersion();

if (parseFloat(downloadReceiptVersion) < 2.0) {
  // Original v1.x adopter detected - bypass subscription checking entirely
  isPremiumUnlocked = true;
} else {
  // New user - run default monetization engine checking rules
  isPremiumUnlocked = evaluateActiveStoreSubscriptionState();
}
Use code with caution.