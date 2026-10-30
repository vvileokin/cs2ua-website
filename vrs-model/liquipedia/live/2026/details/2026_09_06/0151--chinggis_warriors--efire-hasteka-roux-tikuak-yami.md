### Roster Details<br />
Team Name: Chinggis Warriors<br />
Roster: efire, hasteka, ROUX, Tikuak, yAmi<br />
Global Rank: [151](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Asia]( ../../standings_asia_2026_09_06.md)<br />
Regional Rank: [12]( ../../standings_asia_2026_09_06.md)<br />
<br />
Final Rank Value:  789.3<br />
<br />
Final Rank Value (789.3) = Starting Rank Value (769.1) + Head To Head Adjustments (20.1)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.309[<sup>1</sup>](#table2)
- Bounty Collected: 0.279[<sup>2</sup>](#table1)
- Opponent Network: 0.033[<sup>2</sup>](#table1)
- LAN Wins: 0.156[<sup>2</sup>](#table1)

The average of these factors is 0.194<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 769.1
- 400 + ( ( 0.194 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 769.1


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.118
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                  | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                               |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           36 |     3197 | 2026-05-13 | 5star eSports             | L   | 0.422      | -            | -                | -                | -         |    -4.93 | efire, hasteka, ROUX, Tikuak, yAmi   |
|           35 |     3207 | 2026-05-12 | Ground Zero Gaming        | W   | 0.420      | 0.548        | 0.014 (0.003)    | 0.375 (0.086)    | 1 (0.420) |     9.03 | efire, hasteka, ROUX, Tikuak, yAmi   |
|           34 |     3250 | 2026-05-11 | JiJieHao                  | L   | 0.413      | -            | -                | -                | -         |    -0.36 | efire, hasteka, ROUX, Tikuak, yAmi   |
|           33 |     3289 | 2026-05-10 | NEXVOID                   | W   | 0.407      | 0.548        | 0.015 (0.003)    | 0.361 (0.081)    | 1 (0.407) |     6.61 | efire, hasteka, ROUX, Tikuak, yAmi   |
|           32 |     3505 | 2026-05-02 | TYLOO                     | L   | 0.349      | -            | -                | -                | -         |    -0.51 | efire, hasteka, ROUX, Tikuak, yAmi   |
|           31 |     3560 | 2026-05-01 | NEXVOID                   | L   | 0.343      | -            | -                | -                | -         |    -5.32 | efire, hasteka, ROUX, Tikuak, yAmi   |
|           30 |     3651 | 2026-04-29 | TYLOO                     | W   | 0.329      | 0.333        | 0.145 (0.016)    | 0.564 (0.062)    | 0 (0.000) |     9.92 | efire, hasteka, ROUX, Tikuak, yAmi   |
|           29 |     3733 | 2026-04-27 | Just Swing (Chinese team) | W   | 0.316      | 0.333        | 0.003 (0.000)    | 0.268 (0.028)    | -         |     3.99 | efire, hasteka, ROUX, Tikuak, yAmi   |
|           28 |     3796 | 2026-04-26 | Legion (Pakistani team)   | W   | 0.309      | -            | -                | -                | -         |     1.76 | efire, hasteka, ROUX, Tikuak, yAmi   |
|           27 |     4246 | 2026-04-09 | FengDa Gaming             | L   | 0.196      | -            | -                | -                | -         |    -4.11 | cool4st, efire, Redka, ROUX, Tikuak  |
|           26 |     4269 | 2026-04-08 | NEXVOID                   | W   | 0.189      | 0.333        | 0.015 (0.001)    | 0.361 (0.023)    | -         |     3.04 | cool4st, efire, Redka, ROUX, Tikuak  |
|           25 |     4301 | 2026-04-07 | FengDa Gaming             | L   | 0.183      | -            | -                | -                | -         |    -3.86 | cool4st, efire, Redka, ROUX, Tikuak  |
|           24 |     4384 | 2026-04-05 | The KnockoutX             | W   | 0.169      | 0.333        | -                | 0.047 (0.003)    | -         |     0.97 | cool4st, efire, Redka, ROUX, Tikuak  |
|           23 |     4413 | 2026-04-04 | TYLOO                     | L   | 0.167      | -            | -                | -                | -         |    -0.23 | cool4st, efire, ligroo, ROUX, Tikuak |
|           22 |     4483 | 2026-04-04 | FlyQuest                  | L   | 0.161      | -            | -                | -                | -         |    -0.60 | cool4st, efire, ligroo, ROUX, Tikuak |
|           21 |     4544 | 2026-04-03 | Team Arise                | W   | 0.156      | -            | -                | -                | -         |     0.55 | cool4st, efire, Redka, ROUX, Tikuak  |
|           20 |     4642 | 2026-04-02 | 5star eSports             | W   | 0.149      | 0.333        | 0.008 (0.000)    | 0.323 (0.016)    | -         |     2.97 | cool4st, efire, Redka, ROUX, Tikuak  |
|           19 |     4679 | 2026-04-01 | The Huns Esports          | W   | 0.147      | 0.354        | 0.025 (0.001)    | 0.363 (0.019)    | 1 (0.147) |     2.87 | cool4st, efire, ligroo, ROUX, Tikuak |
|           18 |     4752 | 2026-04-01 | The Huns Esports          | L   | 0.142      | -            | -                | -                | -         |    -1.72 | cool4st, efire, ligroo, ROUX, Tikuak |
|           17 |     4767 | 2026-03-31 | Rare Atom                 | W   | 0.140      | 0.354        | 0.001 (0.000)    | -                | 1 (0.140) |     1.62 | cool4st, efire, ligroo, ROUX, Tikuak |
|           16 |     4836 | 2026-03-31 | VTM Esports               | W   | 0.136      | -            | -                | -                | -         |     0.48 | cool4st, efire, ligroo, ROUX, Tikuak |
|           15 |     4863 | 2026-03-31 | NEXVOID                   | L   | 0.135      | -            | -                | -                | -         |    -2.13 | cool4st, efire, ligroo, ROUX, Tikuak |
|           14 |     5084 | 2026-03-28 | Unsettled Resentment      | W   | 0.116      | -            | -                | -                | -         |     0.41 | cool4st, efire, ligroo, ROUX, Tikuak |
|           13 |     5089 | 2026-03-28 | SHPL                      | W   | 0.115      | -            | -                | -                | -         |     0.41 | cool4st, efire, ligroo, ROUX, Tikuak |
|           12 |     5408 | 2026-03-22 | Banzai                    | W   | 0.075      | -            | -                | -                | 1 (0.075) |     0.84 | cool4st, efire, ligroo, ROUX, Tikuak |
|           11 |     5458 | 2026-03-21 | QuantumX                  | L   | 0.070      | -            | -                | -                | -         |    -1.55 | cool4st, efire, Redka, ROUX, Tikuak  |
|           10 |     5471 | 2026-03-21 | Banzai                    | W   | 0.068      | -            | -                | -                | 1 (0.068) |     0.77 | cool4st, efire, ligroo, ROUX, Tikuak |
|            9 |     5515 | 2026-03-20 | The KnockoutX             | L   | 0.063      | -            | -                | -                | -         |    -1.63 | cool4st, efire, Redka, ROUX, Tikuak  |
|            8 |     5568 | 2026-03-19 | NEXVOID                   | W   | 0.055      | 0.307        | 0.015 (0.000)    | 0.361 (0.006)    | 1 (0.055) |     0.86 | cool4st, efire, ligroo, ROUX, Tikuak |
|            7 |     5574 | 2026-03-18 | The Huns Esports          | L   | 0.053      | -            | -                | -                | -         |    -0.64 | cool4st, efire, ligroo, ROUX, Tikuak |
|            6 |     5651 | 2026-03-17 | 5star eSports             | W   | 0.043      | 0.307        | 0.008 (0.000)    | 0.323 (0.004)    | 1 (0.043) |     0.86 | cool4st, efire, ligroo, ROUX, Tikuak |
|            5 |     5659 | 2026-03-17 | 100RA                     | W   | 0.042      | -            | -                | -                | 1 (0.042) |     0.15 | cool4st, efire, ligroo, ROUX, Tikuak |
|            4 |     5703 | 2026-03-15 | 5star eSports             | L   | 0.034      | -            | -                | -                | -         |    -0.39 | cool4st, efire, ligroo, ROUX, Tikuak |
|            3 |     5881 | 2026-03-12 | Lynn Vision Gaming        | L   | 0.009      | -            | -                | -                | -         |    -0.01 | cool4st, efire, ligroo, ROUX, Tikuak |
|            2 |     5897 | 2026-03-11 | TYLOO                     | L   | 0.007      | -            | -                | -                | -         |    -0.01 | cool4st, efire, ligroo, ROUX, Tikuak |
|            1 |     5930 | 2026-03-10 | Alter Ego                 | W   | 0.001      | -            | -                | -                | -         |     0.01 | cool4st, efire, ligroo, ROUX, Tikuak |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($2,932.49)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.01) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-05-17 |      0.448 | $3,000.00      | $1,344.03       |
| 2026-05-03 |      0.356 | $1,500.00      | $534.10         |
| 2026-04-09 |      0.196 | $2,500.00      | $490.16         |
| 2026-04-04 |      0.167 | $2,250.00      | $376.77         |
| 2026-03-22 |      0.075 | $2,510.00      | $187.44         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
