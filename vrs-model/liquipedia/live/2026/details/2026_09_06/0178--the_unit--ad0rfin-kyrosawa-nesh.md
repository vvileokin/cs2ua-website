### Roster Details<br />
Team Name: THE UNIT<br />
Roster: ad0rfin, kyrosawa, nesh<br />
Global Rank: [178](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Asia]( ../../standings_asia_2026_09_06.md)<br />
Regional Rank: [14]( ../../standings_asia_2026_09_06.md)<br />
<br />
Final Rank Value:  735.6<br />
<br />
Final Rank Value (735.6) = Starting Rank Value (722.7) + Head To Head Adjustments (12.9)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.271[<sup>1</sup>](#table2)
- Bounty Collected: 0.192[<sup>2</sup>](#table1)
- Opponent Network: 0.002[<sup>2</sup>](#table1)
- LAN Wins: 0.214[<sup>2</sup>](#table1)

The average of these factors is 0.170<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 722.7
- 400 + ( ( 0.170 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 722.7


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


| Match Played | Match ID | Date       | Opponent                    | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                      |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            6 |     1154 | 2026-08-02 | DEPO                        | L   | 0.962      | -            | -                | -                | -         |    -3.03 | ad0rfin, enzero, kyrosawa, mareefishy, nesh |
|            5 |     1167 | 2026-08-01 | Troublemakers (Kyrgyz team) | W   | 0.957      | 0.342        | 0.001 (0.000)    | 0.037 (0.012)    | 1 (0.957) |    11.77 | ad0rfin, enzero, kyrosawa, mareefishy, nesh |
|            4 |     1180 | 2026-08-01 | OMEGA                       | L   | 0.955      | -            | -                | -                | -         |    -2.32 | ad0rfin, enzero, kyrosawa, mareefishy, nesh |
|            3 |     1186 | 2026-08-01 | Troublemakers (Kyrgyz team) | W   | 0.955      | 0.342        | 0.001 (0.000)    | 0.037 (0.012)    | 1 (0.955) |    12.25 | ad0rfin, enzero, kyrosawa, mareefishy, nesh |
|            2 |     4066 | 2026-04-18 | DNK                         | L   | 0.256      | -            | -                | -                | -         |    -5.28 | ad0rfin, imyGDx, kyrosawa, nesh, nursSSS    |
|            1 |     4072 | 2026-04-18 | DEPO                        | L   | 0.254      | -            | -                | -                | -         |    -0.51 | ad0rfin, imyGDx, kyrosawa, nesh, nursSSS    |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($1,027.18)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-08-02 |      0.963 | $1,000.00      | $962.50         |
| 2026-04-19 |      0.262 | $246.79        | $64.68          |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
