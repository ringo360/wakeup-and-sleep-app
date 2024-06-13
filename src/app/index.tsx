import { Hono } from "hono";
import { html } from "hono/html";

const server = new Hono()

server.get('/', (c) => {
    return c.html(
        <html>
            <body>
                <script src="index.js"></script>
                <iframe src="components/header.html" scrolling="no" frameborder="0" style="border: 1px solid greenyellow" width="100%" height="10%"></iframe>
                <aside id="header"></aside>
                <div class="app">
                    <div class="title">
                        <h1>早寝早起き朝ごはんアプリ</h1>
                    </div>
                    <div class="buttons">
                        <button id="btn" onclick="sleep(this)">就寝</button>
                        <button id="btn" onclick="wakeup(this)">起床</button>
                    </div>
                    <hr />
                    <div class="list">
                        <h2>就寝・起床時間の記録</h2>
                       
                        <table>
   
                            <tr>
                                <th>日付</th><th>就寝</th><th>起床</th>
                            </tr>

                            <tr>
                                <td>2024/04/25</td><td>23:00</td><td>5:30</td>
                            </tr>
                            <tr>
                                <td>2024/04/26</td><td>23:10</td><td>5:36</td>
                            </tr>
                            <tr>
                                <td>2024/04/27</td><td>22:53</td><td>5:20</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </body>
        </html>
        // todo <script> <style>
    )
})

export default server;