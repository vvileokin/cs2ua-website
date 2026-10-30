### Roster Details<br />
Team Name: Sashi Academy<br />
Roster: Bl4zE, Damsi, Half, rosen, Thom<br />
Global Rank: [387](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [243]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  408.8<br />
<br />
Final Rank Value (408.8) = Starting Rank Value (407.4) + Head To Head Adjustments (1.4)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.000[<sup>2</sup>](#table1)
- Opponent Network: 0.000[<sup>2</sup>](#table1)
- LAN Wins: 0.015[<sup>2</sup>](#table1)

The average of these factors is 0.004<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 407.4
- 400 + ( ( 0.004 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 407.4


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.005
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                  | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                          |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            5 |     4782 | 2026-03-31 | Aimhaus                   | W   | 0.138      | 0.341        | 0.000 (0.000)    | 0.028 (0.001)    | 1 (0.138) |     2.36 | Bl4zE, Damsi, Half, rosen, Thom |
|            4 |     4808 | 2026-03-31 | BESTIA                    | L   | 0.137      | -            | -                | -                | -         |    -0.20 | Bl4zE, Damsi, Half, rosen, Thom |
|            3 |     4813 | 2026-03-31 | Esport Academy Copenhagen | L   | 0.136      | -            | -                | -                | -         |    -0.06 | Bl4zE, Damsi, Half, rosen, Thom |
|            2 |     4827 | 2026-03-31 | Falcons Force             | L   | 0.136      | -            | -                | -                | -         |    -0.65 | Bl4zE, Damsi, Half, rosen, Thom |
|            1 |     4855 | 2026-03-31 | 3DMAX                     | L   | 0.135      | -            | -                | -                | -         |    -0.03 | Bl4zE, Damsi, Half, rosen, Thom |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
