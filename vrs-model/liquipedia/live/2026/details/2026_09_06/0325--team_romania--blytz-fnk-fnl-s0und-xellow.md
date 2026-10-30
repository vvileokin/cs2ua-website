### Roster Details<br />
Team Name: Team Romania<br />
Roster: Blytz, fNk, fnl, s0und, XELLOW<br />
Global Rank: [325](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [206]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  542.0<br />
<br />
Final Rank Value (542.0) = Starting Rank Value (519.8) + Head To Head Adjustments (22.2)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.233[<sup>2</sup>](#table1)
- Opponent Network: 0.013[<sup>2</sup>](#table1)
- LAN Wins: 0.006[<sup>2</sup>](#table1)

The average of these factors is 0.063<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 519.8
- 400 + ( ( 0.063 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 519.8


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.036
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                          |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            9 |     1563 | 2026-07-19 | Ex-Zero Tenacity        | W   | 0.869      | 0.143        | 0.031 (0.004)    | 1.000 (0.124)    | 0 (0.000) |    23.56 | fNk, HOLY, lauNX, s0und, XELLOW |
|            8 |     4966 | 2026-03-29 | IC Esports              | L   | 0.123      | -            | -                | -                | -         |    -0.01 | Blytz, fNk, fnl, s0und, XELLOW  |
|            7 |     5002 | 2026-03-29 | BASEMENT BOYS           | L   | 0.122      | -            | -                | -                | -         |    -0.18 | Blytz, fNk, fnl, s0und, XELLOW  |
|            6 |     5255 | 2026-03-24 | Aimclub (Romanian team) | L   | 0.090      | -            | -                | -                | -         |    -1.37 | Blytz, fNk, fnl, s0und, XELLOW  |
|            5 |     5279 | 2026-03-24 | MOUZ NXT                | L   | 0.089      | -            | -                | -                | -         |    -0.91 | Blytz, fNk, fnl, s0und, XELLOW  |
|            4 |     5795 | 2026-03-13 | GRINGOS                 | W   | 0.019      | 0.349        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (0.019) |     0.20 | Blytz, fNk, fnl, s0und, XELLOW  |
|            3 |     5798 | 2026-03-13 | BC.Game Esports         | W   | 0.018      | 0.349        | 0.008 (0.000)    | 0.008 (0.000)    | 1 (0.018) |     0.41 | Blytz, fNk, fnl, s0und, XELLOW  |
|            2 |     5799 | 2026-03-13 | OG                      | L   | 0.018      | -            | -                | -                | -         |    -0.04 | Blytz, fNk, fnl, s0und, XELLOW  |
|            1 |     5812 | 2026-03-13 | Alliance                | W   | 0.017      | 0.349        | 0.210 (0.001)    | 0.449 (0.003)    | 1 (0.017) |     0.55 | Blytz, fNk, fnl, s0und, XELLOW  |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
