import cv2

def draw_plot(axes, titles, images, extra_fun=None):
    for ax, title, image in zip(axes, titles, images):
        for a, tit, img in zip(ax, title, image):
            if len(img.shape) == 2:
                a.imshow(img, cmap='gray')
            else:
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                a.imshow(img)
            a.set_title(tit)
            a.axis('off')

            if extra_fun:
                extra_fun(a, img)

def draw_plot2(axes, titles, images, extra_fun=None):
    for ax, title, image in zip(axes.flat, titles, images):
        if len(image.shape) == 2:
            ax.imshow(image, cmap='gray')
        else:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            ax.imshow(image)
        ax.set_title(title)
        ax.axis('off')

        if extra_fun:
            extra_fun(ax, image)