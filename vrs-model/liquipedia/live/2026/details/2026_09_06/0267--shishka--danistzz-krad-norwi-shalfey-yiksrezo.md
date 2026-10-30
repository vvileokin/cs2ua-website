### Roster Details<br />
Team Name: SHISHKA<br />
Roster: danistzz, Krad, Norwi, shalfey, yiksrezo<br />
Global Rank: [267](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [178]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  635.1<br />
<br />
Final Rank Value (635.1) = Starting Rank Value (617.1) + Head To Head Adjustments (18.1)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.230[<sup>1</sup>](#table2)
- Bounty Collected: 0.215[<sup>2</sup>](#table1)
- Opponent Network: 0.012[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.114<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 617.1
- 400 + ( ( 0.114 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 617.1


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.040
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent           | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                   |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            5 |     2112 | 2026-06-19 | K27                | L   | 0.669      | -            | -                | -                | -         |    -0.30 | danistzz, Krad, Norwi, shalfey, yiksrezo |
|            4 |     2363 | 2026-06-07 | CYBERSHOKE Esports | W   | 0.590      | 0.384        | 0.006 (0.001)    | 0.249 (0.056)    | 0 (0.000) |    15.02 | danistzz, Krad, Norwi, shalfey, yiksrezo |
|            3 |     3075 | 2026-05-17 | Saint Sinners      | L   | 0.450      | -            | -                | -                | -         |    -4.58 | danistzz, Krad, Norwi, shalfey, yiksrezo |
|            2 |     3100 | 2026-05-16 | UPGRADE Team       | L   | 0.443      | -            | -                | -                | -         |    -1.20 | danistzz, Krad, Norwi, shalfey, yiksrezo |
|            1 |     3152 | 2026-05-14 | Saint Sinners      | W   | 0.431      | 0.278        | 0.007 (0.001)    | 0.505 (0.060)    | 0 (0.000) |     9.12 | danistzz, Krad, Norwi, shalfey, yiksrezo |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($225.46)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-05-17 |      0.451 | $500.00        | $225.46         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
