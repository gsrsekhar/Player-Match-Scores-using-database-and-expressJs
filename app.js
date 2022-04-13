const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const playerQuery = `SELECT *FROM player_details ;`;
  const player = await database.all(playerQuery);
  response.send(
    player.map((eachPlayer) => convertPlayerObjectToResponseObject(eachPlayer))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT * FROM player_details WHERE player_id =${playerId};`;
  const player = await database.get(playerQuery);
  response.send(convertPlayerObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const playerQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await database.get(playerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `SELECT * FROM match_details WHERE match_id =${matchId};`;
  const match = await database.get(matchQuery);
  response.send(convertMatchObjectToResponseObject(match));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id =${playerId} ;`;
  const player = await database.all(playerQuery);
  response.send(
    player.map((eachPlayer) => convertMatchObjectToResponseObject(eachPlayer))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerQuery = `SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id =${matchId};`;
  const player = await database.all(playerQuery);
  response.send(
    player.map((eachPlayer) => convertPlayerObjectToResponseObject(eachPlayer))
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await database.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;
