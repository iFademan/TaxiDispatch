$(function() {
    // Datepicker
    $('.input-group.date').datepicker({
        format: 'dd/mm/yyyy',
        startView: 1,
        todayBtn: true,
        language: 'ru',
        autoclose: true
    });

    // Switchers for all users
    var radioGender = $('.radio1');
    var checkboxDriver = $('.checkbox2');
    radioGender.bootstrapSwitch();
    $('#checkbox1').bootstrapSwitch();
    checkboxDriver.bootstrapSwitch();

    radioGender.on('switch-change', function() {
        $('.radio1').bootstrapSwitch('toggleRadioState');
    });

    // Switcher for drivers
    $('#driverLicenseId').hide();
    $('#experience').hide();

    checkboxDriver.on('switch-change', function() {
        $('#driverLicenseId').slideToggle(200);
        $('#experience').slideToggle(200);
    });
});
