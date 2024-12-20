var timer_update = null;
var last_called = 0;
var ok_status = null;

$(document).ready(function() {
    console.log('Ready!');

    var table = '';
    for (var i = 1; i < 91; i++) {
        if (i % 10 == 1) table += '<tr>';
        table += '<td><div class="number" id="number-' + i + '">' + i + '</div></td>';
        if (i % 10 == 0) table += '</tr>';
    }
    startUpdate();
    $('#tavola').html(table);
    $('#btnCall').click(function() {
        $.getJSON('/endpoint/board_extract/?room_name=' + board_options.room_slug, async function(res) {
            if (res.status === 'OK') {
                printNumModal(res.data.board.last_called.toString(), "#modal-content", "modal-number");
                $("#board").css("display", "none");
                // $("#modal").css("display", "flex");
                $("#modal").css("opacity", 1);
                await sleep(2500);
                // $("#modal").css("display", "none");
                $("#modal").css("opacity", 0);
                await sleep(500);
                $("#board").css("display", "block");
                removeAllChild("modal-content")
                // printNum(res.data.board.last_called.toString(), '#last-called-holder', 'big-number'); // Col modale lo mette get room, non so il perché
                // await sleep(2000)
                // $('#number-' + res.data.board.last_called).addClass('called'); // Col modale lo mette get room, non so il perché
                last_called = res.data.board.last_called;
            } else {
                console.log(res.message);
                if (res.status === 'WARN') 
                    showAlert(res.message);
            }
        });
    });
    $('#btnReset').click(function() {
        resetBoard(true);
    });
    $('#btnRefresh').click(function() {
        if ($(this).data('state') == 'on') {
            $(this).html('Sincronizza: off');
            $(this).data('state', 'off');
            stopUpdate();
        } else {
            $(this).html('Sincronizza: on');
            $(this).data('state', 'on');
            startUpdate();
        }
    });
});

// Avvia e arresta il timer di aggiornamento del tabellone
function startUpdate() { timer_update = setInterval(getRoom, 1000); }
function stopUpdate() { clearInterval(timer_update); }

// Ottiene i dati dall'endpoint e aggiorna il tabellone
function getRoom() {
    $.getJSON('/endpoint/get_board/?room_name=' + board_options.room_slug, function(res) {
        var status = true;

        if (res.status === 'OK') {
            if (res.data.board.last_called != last_called) {
                if (res.data.board.last_called == -1) resetBoard();
                $.each(res.data.board.called_list, function(pos, num) {
                    $('#number-' + num).addClass('called');
                });
                $('#last-called-holder').html('');
                for (var i = res.data.board.called_list.length - 4; i < res.data.board.called_list.length; i++) {
                    if (i >= 0) {
                        printNum(res.data.board.called_list[i].toString(), '#last-called-holder', 'big-number');
                    }
                }
                last_called = res.data.board.last_called;
            }
        } else {
            status = false;
            console.log(res.message);
        }

        if (ok_status === null || status != ok_status) {
            ok_status = status;

            if (ok_status) {
                switchPanel('#global_msgs', '#board');
                
                if (mobileCheck()) {
                    console.log('Oh, you\'re on mobile!');
                    $('#fullscreenAlert').fadeIn();
                    $('body').addClass('smartphone');
                }
            } else {
                switchPanel('#board', '#global_msgs');
                $('#global_msgs').html(res.message).addClass('red');
            }
        }
    });
}

// Pulisce il tabellone
function resetBoard(reset_room = false) {
    $('.number').removeClass('called');
    $('#last-called-holder').html('');
    if (reset_room) $.getJSON('/endpoint/board_reset/?room_name=' + board_options.room_slug);
}

// Aggiunge un numero al contenitore degli ultimi numeri chiamati
function printNum(num, container_sel, items_sel) {
    var elem = '<div class="called-number"><div class="called-number-container">';
    if (num < 10) elem += '<div class="' + items_sel + ' n0"></div>';
    for (var i = 0; i < num.length; i++)
        elem += '<div class="' + items_sel + ' n' + num[i] + '"></div>';
    $(container_sel).prepend(elem + '</div></div>');
    if ($(container_sel + '> div').children().length > 4)
        $(container_sel + '> div').last().remove();
}

// Aggiunge un numero al contenitore degli ultimi numeri chiamati
function printNumModal(num, container_sel, items_sel) {
    var elem = '<p class="' + items_sel + ' n' + num + '">' + num + '</p>';
    $(container_sel).prepend(elem);
}

// Swap dei pannelli a schermo
function switchPanel(from, to) {
    if (($(from).css('display') == 'none')) {
        console.log('hidden');
        $(to).fadeIn(500);
    } else {
        $(from).fadeOut(500, function() {
            $(to).fadeIn(500);
        });
    }
}

// Mostra un alert al centro dello schermo con messaggio <alert_text> per <timeout> secondi (def. 2 secondi)
function showAlert(alert_text, panel_id = '#alert_panel', timeout = 2000) {
    $(panel_id + ' > h1').html(alert_text);
    showPanel(panel_id, timeout);
}

// Cambia la visibiltià di un pannello a schermo per <timeout> secondi (def. disabilitato)
function showPanel(panel_id, timeout = false) {
    $(panel_id).fadeIn(100, function() { 
        $(panel_id).animate({ zoom: 1.1, speed: 200 }, { easing: 'swing', done: function() { 
                $(panel_id).animate({ zoom: 1, speed: 100 }, { easing: 'swing' });
            } 
        });
    });
    if (timeout !== false) setTimeout(function() { $(panel_id).fadeOut(200) }, timeout);
}

function removeAllChild(container_sel) {
    const myNode = document.getElementById(container_sel);
    myNode.textContent = ''; 
    // myNode.innerHTML = '' 
    // while (myNode.firstChild) {
    //     myNode.removeChild(myNode.lastChild);
    // }
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))