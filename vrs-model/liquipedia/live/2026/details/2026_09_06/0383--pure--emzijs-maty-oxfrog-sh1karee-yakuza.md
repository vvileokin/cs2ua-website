### Roster Details<br />
Team Name: PURE<br />
Roster: emzijs, maty, OXFROG, Sh1karee, yakuza<br />
Global Rank: [383](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [242]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  429.2<br />
<br />
Final Rank Value (429.2) = Starting Rank Value (423.8) + Head To Head Adjustments (5.4)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.000[<sup>2</sup>](#table1)
- Opponent Network: 0.000[<sup>2</sup>](#table1)
- LAN Wins: 0.050[<sup>2</sup>](#table1)

The average of these factors is 0.013<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 423.8
- 400 + ( ( 0.013 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 423.8


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.017
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                 |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            5 |     3094 | 2026-05-16 | Honvéd Esport           | L   | 0.444      | -            | -                | -                | -         |    -1.21 | emzijs, maty, OXFROG, Sh1karee, yakuza |
|            4 |     3108 | 2026-05-16 | Matrix (Ukrainian team) | W   | 0.443      | 0.341        | 0.000 (0.000)    | 0.032 (0.005)    | 1 (0.443) |     8.92 | emzijs, maty, OXFROG, Sh1karee, yakuza |
|            3 |     3114 | 2026-05-16 | MASONIC                 | L   | 0.441      | -            | -                | -                | -         |    -0.91 | emzijs, maty, OXFROG, Sh1karee, yakuza |
|            2 |     4454 | 2026-04-04 | Sangal Esports          | L   | 0.163      | -            | -                | -                | -         |    -0.88 | emzijs, maty, OXFROG, Sh1karee, yakuza |
|            1 |     4477 | 2026-04-04 | Passion UA              | L   | 0.162      | -            | -                | -                | -         |    -0.49 | emzijs, maty, OXFROG, Sh1karee, yakuza |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
