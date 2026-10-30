### Roster Details<br />
Team Name: Trainwrecks eSports<br />
Roster: AhMa, hattivati, LapaSSS, melty<br />
Global Rank: [324](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [205]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  544.0<br />
<br />
Final Rank Value (544.0) = Starting Rank Value (532.4) + Head To Head Adjustments (11.7)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.165[<sup>2</sup>](#table1)
- Opponent Network: 0.008[<sup>2</sup>](#table1)
- LAN Wins: 0.106[<sup>2</sup>](#table1)

The average of these factors is 0.070<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 532.4
- 400 + ( ( 0.070 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 532.4


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.037
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent        | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                  |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            5 |     1206 | 2026-07-31 | BC.Game Esports | L   | 0.950      | -            | -                | -                | -         |    -0.51 | AhMa, hattivati, LapaSSS, melty, Samppa |
|            4 |     1211 | 2026-07-31 | ROUNDS          | W   | 0.949      | 0.362        | 0.000 (0.000)    | 0.222 (0.076)    | 1 (0.949) |    19.52 | AhMa, hattivati, LapaSSS, melty, Samppa |
|            3 |     1223 | 2026-07-31 | HAVU            | L   | 0.948      | -            | -                | -                | -         |    -4.54 | AhMa, hattivati, LapaSSS, melty, Samppa |
|            2 |     2875 | 2026-05-23 | Strael-Bora     | L   | 0.489      | -            | -                | -                | -         |    -2.66 | AhMa, hattivati, Lapa, LapaSSS, melty   |
|            1 |     2891 | 2026-05-23 | 100 Thieves     | L   | 0.488      | -            | -                | -                | -         |    -0.12 | AhMa, hattivati, Lapa, LapaSSS, melty   |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
