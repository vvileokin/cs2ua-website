### Roster Details<br />
Team Name: Banzai<br />
Roster: fury5k, MagnumZ, QQLIGHTNING, rhitta, wonderzce<br />
Global Rank: [276](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Asia]( ../../standings_asia_2026_09_06.md)<br />
Regional Rank: [29]( ../../standings_asia_2026_09_06.md)<br />
<br />
Final Rank Value:  619.7<br />
<br />
Final Rank Value (619.7) = Starting Rank Value (661.5) + Head To Head Adjustments (-41.8)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.236[<sup>1</sup>](#table2)
- Bounty Collected: 0.245[<sup>2</sup>](#table1)
- Opponent Network: 0.007[<sup>2</sup>](#table1)
- LAN Wins: 0.061[<sup>2</sup>](#table1)

The average of these factors is 0.138<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 661.5
- 400 + ( ( 0.138 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 661.5


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.050
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent             | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                          |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           21 |      465 | 2026-08-26 | Not A Squad Esports  | L   | 1.000      | -            | -                | -                | -         |   -21.07 | anotherrr, fury5k, obi, QQLIGHTNING, rhitta     |
|           20 |      513 | 2026-08-25 | Vitalem Aerem Gaming | L   | 1.000      | -            | -                | -                | -         |   -13.80 | anotherrr, fury5k, obi, QQLIGHTNING, rhitta     |
|           19 |     3522 | 2026-05-01 | Vitalem Aerem Gaming | L   | 0.347      | -            | -                | -                | -         |    -4.93 | fury5k, MagnumZ, QQLIGHTNING, rhitta, wonderzce |
|           18 |     3563 | 2026-05-01 | WYDO Esports         | W   | 0.343      | 0.471        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (0.343) |     2.05 | fury5k, MagnumZ, QQLIGHTNING, rhitta, wonderzce |
|           17 |     3611 | 2026-04-30 | LEGAM                | L   | 0.335      | -            | -                | -                | -         |    -6.39 | fury5k, MagnumZ, QQLIGHTNING, rhitta, wonderzce |
|           16 |     3695 | 2026-04-28 | QuantumX             | L   | 0.323      | -            | -                | -                | -         |    -5.77 | fury5k, MagnumZ, QQLIGHTNING, rhitta, wonderzce |
|           15 |     3731 | 2026-04-27 | The Huns Esports     | L   | 0.316      | -            | -                | -                | -         |    -2.59 | fury5k, MagnumZ, QQLIGHTNING, rhitta, wonderzce |
|           14 |     3793 | 2026-04-26 | Vitalem Aerem Gaming | W   | 0.309      | 0.333        | 0.000 (0.000)    | 0.184 (0.019)    | 0 (0.000) |     5.32 | fury5k, MagnumZ, QQLIGHTNING, rhitta, wonderzce |
|           13 |     4302 | 2026-04-07 | NEXVOID              | L   | 0.183      | -            | -                | -                | -         |    -2.04 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|           12 |     4340 | 2026-04-06 | QuantumX             | W   | 0.176      | 0.333        | 0.000 (0.000)    | 0.054 (0.003)    | 0 (0.000) |     2.44 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|           11 |     4385 | 2026-04-05 | FengDa Gaming        | L   | 0.169      | -            | -                | -                | -         |    -2.86 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|           10 |     4546 | 2026-04-03 | TYLOO                | W   | 0.156      | 0.333        | 0.145 (0.008)    | 0.564 (0.029)    | 0 (0.000) |     4.81 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|            9 |     4651 | 2026-04-02 | BORING PLAYER        | W   | 0.149      | 0.333        | 0.000 (0.000)    | 0.058 (0.003)    | 0 (0.000) |     2.21 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|            8 |     5408 | 2026-03-22 | Chinggis Warriors    | L   | 0.075      | -            | -                | -                | -         |    -0.84 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|            7 |     5463 | 2026-03-21 | NEXVOID              | W   | 0.069      | 0.307        | 0.015 (0.000)    | 0.361 (0.008)    | 1 (0.069) |     1.40 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|            6 |     5471 | 2026-03-21 | Chinggis Warriors    | L   | 0.068      | -            | -                | -                | -         |    -0.77 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|            5 |     5573 | 2026-03-18 | The Huns Esports     | W   | 0.054      | 0.307        | 0.025 (0.000)    | 0.363 (0.006)    | 1 (0.054) |     1.28 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|            4 |     5612 | 2026-03-18 | 5star eSports        | L   | 0.049      | -            | -                | -                | -         |    -0.37 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|            3 |     5656 | 2026-03-17 | QuantumX             | W   | 0.042      | 0.307        | 0.000 (0.000)    | 0.054 (0.001)    | 1 (0.042) |     0.58 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|            2 |     5664 | 2026-03-16 | The MongolZ Academy  | W   | 0.041      | 0.354        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (0.041) |     0.24 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |
|            1 |     5666 | 2026-03-16 | QuantumX             | L   | 0.040      | -            | -                | -                | -         |    -0.72 | fury5k, MagnumZ, me1o, QQLIGHTNING, rhitta      |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($300.16)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-04-09 |      0.196 | $1,000.00      | $196.06         |
| 2026-03-22 |      0.075 | $1,394.00      | $104.10         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
