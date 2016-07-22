function generatePDF(){

	var pdf = new jsPDF('p', 'pt', 'letter');
	source = $('#line-chart')[0];
	specialElementHandlers = {
		'#bypassme': function(element, renderer){
			return true;
		}
	}
	margins = {
		top: 10,
		left: 20,
		width: 500
	};
	pdf.fromHTML(
		source
		, margins.left
		, margins.top
		, {
			'width': margins.width
			, 'elementHandlers': specialElementHandlers
		},
		function(dispose){
			pdf.save('chart2pdf.pdf');
		}
	);
}