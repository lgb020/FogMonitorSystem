<?php
/**
 * Created by IntelliJ IDEA.
 * User: Zero
 * Date: 2017/9/25
 * Time: 15:58
 */

if (isset($_GET['s']) && isset($_GET['callback'])) {
    die($_GET['callback'].'({"status":"1","info":"OK","infocode":"10000","version":"4.0.1"})');
}

if (isset($_GET['type']) && isset($_GET['cbk'])) {
    die($_GET['cbk'].'&&'.$_GET['cbk'].'({})');
}

if (isset($_GET['type'])) {
    die('');
}

if (isset($_GET['m'])) {
    die(file_get_contents('js/modules.js'));
}

