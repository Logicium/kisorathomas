var  WebApp = function(data){
    console.log(data)
    var homeImage = 'public/images/bg4.jpg';
    this.backgroundImage = div().addClass('backgroundImage');
    this.backgroundImage.css(Styles.backgroundImageFull(homeImage));
    this.contentRow = row().addClass('contentRow');
    this.EngineerCol = col(4);
    this.DesignerCol = col(4);
    this.ChefCol = col(4);
    this.contentContainer = div().addClass('text-center');

        $('body').empty().append(
            this.backgroundImage,
            this.contentContainer.append(
                siteBar('KT'),
                this.contentRow.append(
                    this.EngineerCol.append(
                        new VerticalSlide(data.engineer)
                    ),
                    this.DesignerCol.append(
                        new VerticalSlide(data.designer)
                    ),
                    this.ChefCol.append(
                        new VerticalSlide(data.chef)
                    )
                )
            )
        ).css('overflow-y','auto');
};
