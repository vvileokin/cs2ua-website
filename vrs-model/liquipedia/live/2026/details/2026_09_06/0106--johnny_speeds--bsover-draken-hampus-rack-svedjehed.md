### Roster Details<br />
Team Name: Johnny Speeds<br />
Roster: bsover, draken, hampus, Rack, Svedjehed<br />
Global Rank: [106](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [79]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  911.6<br />
<br />
Final Rank Value (911.6) = Starting Rank Value (873.4) + Head To Head Adjustments (38.1)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.341[<sup>1</sup>](#table2)
- Bounty Collected: 0.262[<sup>2</sup>](#table1)
- Opponent Network: 0.067[<sup>2</sup>](#table1)
- LAN Wins: 0.326[<sup>2</sup>](#table1)

The average of these factors is 0.249<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 873.4
- 400 + ( ( 0.249 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 873.4


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.113
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent               | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                  |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            5 |     1066 | 2026-08-05 | Betclic Apogee Esports | L   | 0.982      | -            | -                | -                | -         |    -2.52 | bsover, draken, hampus, Rack, Svedjehed |
|            4 |     1088 | 2026-08-04 | G2 Ares                | W   | 0.975      | 0.450        | 0.014 (0.006)    | 0.689 (0.302)    | 1 (0.975) |    18.01 | bsover, draken, hampus, Rack, Svedjehed |
|            3 |     1099 | 2026-08-03 | Metizport              | W   | 0.970      | 0.450        | 0.021 (0.009)    | 0.586 (0.256)    | 1 (0.970) |    22.48 | bsover, draken, hampus, Rack, Svedjehed |
|            2 |     1106 | 2026-08-03 | Lilmix                 | W   | 0.969      | 0.450        | 0.001 (0.000)    | 0.266 (0.116)    | 1 (0.969) |     7.34 | bsover, draken, hampus, Rack, Svedjehed |
|            1 |     1114 | 2026-08-03 | Metizport              | L   | 0.969      | -            | -                | -                | -         |    -7.18 | bsover, draken, hampus, Rack, Svedjehed |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($5,903.06)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.01) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-08-05 |      0.984 | $6,000.00      | $5,903.06       |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
