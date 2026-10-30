### Roster Details<br />
Team Name: Bebop<br />
Roster: dwushka, faydett, h1kaN, iDISBALANCE<br />
Global Rank: [356](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [227]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  496.8<br />
<br />
Final Rank Value (496.8) = Starting Rank Value (484.0) + Head To Head Adjustments (12.8)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.173[<sup>2</sup>](#table1)
- Opponent Network: 0.004[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.044<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 484.0
- 400 + ( ( 0.044 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 484.0


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.013
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                 | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                          |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            7 |     3520 | 2026-05-02 | Butterfly (Russian team) | L   | 0.348      | -            | -                | -                | -         |    -0.41 | dwushka, faydett, h1kaN, iDISBALANCE, Krad      |
|            6 |     3556 | 2026-05-01 | HEROIC Academy           | W   | 0.343      | 0.384        | 0.001 (0.000)    | 0.148 (0.020)    | 0 (0.000) |     7.93 | dwushka, faydett, h1kaN, iDISBALANCE, Krad      |
|            5 |     3618 | 2026-04-30 | Walczaki                 | L   | 0.335      | -            | -                | -                | -         |    -0.51 | dwushka, faydett, h1kaN, iDISBALANCE, Krad      |
|            4 |     3696 | 2026-04-28 | HEROIC Academy           | W   | 0.322      | 0.344        | 0.001 (0.000)    | 0.148 (0.016)    | 0 (0.000) |     7.55 | dwushka, h1kaN, iDISBALANCE, Krad, lov1kus      |
|            3 |     4121 | 2026-04-14 | Color                    | L   | 0.231      | -            | -                | -                | -         |    -0.39 | delus1onn, dwushka, faydett, h1kaN, iDISBALANCE |
|            2 |     4885 | 2026-03-30 | WOPA Esport              | L   | 0.131      | -            | -                | -                | -         |    -0.23 | dwushka, faydett, h1kaN, iDISBALANCE, Norwi     |
|            1 |     5401 | 2026-03-22 | Persona Grata            | L   | 0.076      | -            | -                | -                | -         |    -1.14 | dwushka, faydett, h1kaN, iDISBALANCE, Norwi     |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
